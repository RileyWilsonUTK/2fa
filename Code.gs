const CONDITION_DESCRIPTIONS = {
  '1': 'Section A (Baseline): A minimal 2FA push prompt that only asks "Are you trying to sign in?" with Approve/Deny buttons and provides NO device, location, or IP context.',
  '2': 'Section B (Repeated Requests / MFA Fatigue): Multiple back-to-back 2FA push notifications ("4th sign-in request in the last 2 minutes") for the same login attempt.',
  '3': 'Section C (Number Matching): A 2FA number-matching prompt asking the user to confirm code 47 from an unrecognized mobile browser.',
  '4': 'Section D (High-Context Anomaly): A detailed 2FA push prompt warning of a sign-in attempt from Chrome on Windows 11 in an unfamiliar location (Moscow, Russia, IP 185.220.101.4).'
};

const SYSTEM_PROMPT = `
You are an adaptive security intervention assistant for a university study (COSC 469/569) on Two-Factor Authentication (2FA) prompts.
You will receive the visual 2FA prompt shown, the participant's initial decision, their silent decision latency (in seconds), and their Annoyance/Confusion and Confidence ratings (1-5).

Adapt your warning strategy based on these behavioral signals:
- Fast decision (< 4 seconds) + Approve: Treat as potential habituation/autopilot clicking. Use a sharp, clear pattern-interrupt warning highlighting the specific red flag or missing context they may have overlooked.
- Slow decision (> 10 seconds) OR high Annoyance/Confusion (4-5): Treat as uncertainty or prompt fatigue. Use a calm, plain-language explanation translating the technical cues or repeated requests into simple risk terms.
- Initial Decision = Deny: Reinforce their cautious choice briefly while noting what specific cue in the prompt warranted caution.

Rules:
- Generate ONLY the warning message (2 to 4 short sentences).
- Do NOT ask follow-up questions or mention their exact survey numbers/seconds back to them (make it feel like a smart, natural security alert).
`;

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('COSC 469/569 Class Project — 2FA Prompt Study')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function generateWarning(studyData) {
  const apiKey = (PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '').trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing in Project Settings > Script Properties.');
  }

  const conditionLabel = CONDITION_DESCRIPTIONS[studyData.condition] || ('Section ' + studyData.condition);
  const promptText = `Participant Telemetry & Ratings:
- Prompt Shown: ${conditionLabel}
- Initial Decision: ${studyData.decision}
- Decision Latency: ${studyData.decisionTimeSec} seconds
- Annoyed/Confused (1-5): ${studyData.annoyed}
- Confidence (1-5): ${studyData.confidence}

Generate the adaptive 2FA security warning now.`;

  const payload = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: promptText }] }],
    generationConfig: {
      maxOutputTokens: 250
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-goog-api-key': apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
  const host = 'generative' + 'language.' + 'googleapis.com';
  let responseCode = 0;
  let responseText = '';

  for (let i = 0; i < models.length; i++) {
    const model = models.at(i);
    const url = 'https://' + host + '/v1beta/models/' + model + ':generateContent';

    const httpResponse = UrlFetchApp.fetch(url, options);
    responseCode = httpResponse.getResponseCode();
    responseText = httpResponse.getContentText();

    if (responseCode === 200) {
      break;
    }
    if (responseCode === 503 || responseCode === 429) {
      Utilities.sleep(1500);
    }
  }

  if (responseCode !== 200) {
    throw new Error('Gemini API Error (' + responseCode + '): ' + responseText);
  }

  const response = JSON.parse(responseText);
  return response.candidates.at(0).content.parts.at(0).text.trim();
}

function saveFinalResponse(studyData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Responses');
  sheet.appendRow([
    new Date(),
    'Condition ' + studyData.condition,
    studyData.decision,
    studyData.decisionTimeSec,
    studyData.annoyed,
    studyData.confidence,
    studyData.warning,
    studyData.finalDecision
  ]);
  return true;
}
