// https://script.google.com/macros/s/AKfycbzTpGfrsO_qMKVBZzjxrOPpU6ilEHhvMbXSZjRe0BxJWJHYRtfF/exec
export { };

/**
 * Slackから呼び出される e.parameter.text に引数が入っている
 * @param e
 */
const doPost = (e:GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput => {
  console.log("doPost by console")
  const token = PropertiesService.getScriptProperties().getProperty("SLACK_TOKEN")
  const channels = extractChannels(e.parameter.text)
  const user_id = e.parameter.user_id
  let payload = {
    token: token
  }

  const inviteEntryPoint = "https://slack.com/api/conversations.invite"
  const joinEntryPoint = "https://slack.com/api/conversations.join"
  // すでに参加している場合は面倒なので考慮していない
  channels.forEach((channel) => {
    payload["channel"] = channel
    // 先に自分が入ってないとinviteできない
    console.log(JSON.parse(UrlFetchApp.fetch(joinEntryPoint, {
      method: 'post',
      payload: payload,
      muteHttpExceptions: true
    }).getContentText()))
    payload["users"] = user_id
    const result = JSON.parse(UrlFetchApp.fetch(inviteEntryPoint, {
      method: 'post',
      payload: payload,
      muteHttpExceptions: true
    }).getContentText())
  })

  const message = "参加処理が完了しました"
  const response = {text: message}

  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 与えられた文字列からチャンネルIDを抽出する
 * @param text 
 */
const extractChannels = (text: String, separator = " "): Array<String> => {
  // channel名 => channel_id のマップを取得
  const map = createChannelMap()

  // 与えられたテキストをsplitする
  const names = text.split(separator)
  const channels = names.map((o) => {
    return map[o.trim().replace("#", "")];
  })

  return channels;
}

/**
 * チャンネル名 => チャンネルIDのmapを作成する
 */
const createChannelMap = ():Array<String> => {
  let map = []
  let cursor = null;
  const token = PropertiesService.getScriptProperties().getProperty("SLACK_TOKEN")
  
  let payload = {
    token: token,
    exclude_archived: true,
    limit: 200,
    cursor: ""
  }

  const entryPoint = "https://slack.com/api/conversations.list"
  while(true) {
    const result = JSON.parse(UrlFetchApp.fetch(entryPoint, {
      method: 'get',
      payload: payload,
      muteHttpExceptions: true
    }).getContentText())
    const channels = result["channels"]
    channels.forEach((channel) => {
      map[channel.name] = channel.id
    })
    // ページング
    cursor = result["response_metadata"]["next_cursor"]
    if (cursor === "") {
      return map
    }    
    payload.cursor = cursor
  }
}

/**
 * ダミーレスポンスを返す（利用しない）
 * @param e 
 */
const doGet = (e:GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput => {
  console.log("doGet by console")
  Logger.log("doGet by Logger")
  return ContentService.createTextOutput(new Date().toString())
}