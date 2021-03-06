import * as Bluebird from "bluebird";
import {Incident} from "incident";
import * as api from "../interfaces/api/api";
import {Context} from "../interfaces/api/context";
import * as io from "../interfaces/io";
import * as messagesUri from "../messages-uri";
import {getCurrentTime} from "../utils";

interface SendMessageResponse {
  OriginalArrivalTime: number;
}

interface SendMessageQuery {
  clientmessageid: string;
  content: string;
  messagetype: string;
  contenttype: string;
}

export function sendMessage(io: io.HttpIo, apiContext: Context, message: api.NewMessage,
                            conversationId: string): Bluebird<api.SendMessageResult> {
  return Bluebird
    .try(() => {
      const query: SendMessageQuery = {
        clientmessageid: String(getCurrentTime() + Math.floor(10000 * Math.random())),
        content: String(message.textContent),
        messagetype: "RichText",
        contenttype: "text"
      };
      const requestOptions: io.PostOptions = {
        uri: messagesUri.messages(apiContext.registrationToken.host, messagesUri.DEFAULT_USER, conversationId),
        jar: apiContext.cookieJar,
        body: JSON.stringify(query),
        headers: {
          RegistrationToken: apiContext.registrationToken.raw
        }
      };
      return io.post(requestOptions)
        .then((res: io.Response) => {
          console.log(JSON.stringify(res, null, 2));
          if (res.statusCode !== 201) {
            return Bluebird.reject(new Incident("send-message", "Received wrong return code"));
          }
          const body: SendMessageResponse = JSON.parse(res.body);
          return {
            clientMessageId: query.clientmessageid,
            arrivalTime: body.OriginalArrivalTime,
            textContent: query.content
          };
        });
    });
}

export default sendMessage;
