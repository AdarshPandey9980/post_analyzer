import dotenv from "dotenv";

dotenv.config();

class LangflowClient {
  baseURL: string;
  applicationToken: string;

  constructor(baseURL: string, applicationToken: string) {
    this.baseURL = baseURL;
    this.applicationToken = applicationToken;
  }
  async post(
    endpoint: string,
    body: any,
    headers = { "Content-Type": "application/json" }
  ) {
    headers["Authorization"] = `Bearer ${this.applicationToken}`;
    headers["Content-Type"] = "application/json";
    const url = `${this.baseURL}${endpoint}`;
    
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
      });
  
      const contentType = response.headers.get("content-type");
      let responseMessage;
  
      if (contentType && contentType.includes("application/json")) {
        responseMessage = await response.json();
      } else {
        responseMessage = await response.text();
      }
  
      if (!response.ok) {
        throw new Error(
          `${response.status} ${response.statusText} - ${JSON.stringify(
            responseMessage
          )}`
        );
      }
  
      return responseMessage;
    } catch (error) {
      throw error;
    }
  }

  async initiateSession(
    flowId: string,
    langflowId: string,
    inputValue: string,
    inputType = "chat",
    outputType = "chat",
    stream = false,
    tweaks = {}
  ) {
    const endpoint = `/lf/${langflowId}/api/v1/run/${flowId}?stream=${stream}`;
    return this.post(endpoint, {
      input_value: inputValue,
      input_type: inputType,
      output_type: outputType,
      tweaks: tweaks,
    });
  }

  handleStream(
    streamUrl: string,
    onUpdate: Function,
    onClose: Function,
    onError: Function
  ) {
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onUpdate(data);
    };

    eventSource.onerror = (event) => {
      onError(event);
      eventSource.close();
    };

    eventSource.addEventListener("close", () => {
      onClose("Stream closed");
      eventSource.close();
    });

    return eventSource;
  }

  async runFlow(
    flowIdOrName: string,
    langflowId: string,
    inputValue: string,
    inputType = "chat",
    outputType = "chat",
    tweaks = {},
    stream = false,
    onUpdate: Function,
    onClose: Function,
    onError: Function
  ) {
    try {
      const initResponse = await this.initiateSession(
        flowIdOrName,
        langflowId,
        inputValue,
        inputType,
        outputType,
        stream,
        tweaks
      );
      console.log("Init Response:", initResponse);
  
      if (
        stream &&
        initResponse &&
        initResponse.outputs &&
        initResponse.outputs[0].outputs[0].artifacts.stream_url
      ) {
        const streamUrl =
          initResponse.outputs[0].outputs[0].artifacts.stream_url;
        console.log(`Streaming from: ${streamUrl}`);
        this.handleStream(streamUrl, onUpdate, onClose, onError);
      }
  
      return initResponse;
    } catch (error) {
      console.error("Error running flow:", error);
      onError("Error initiating session");
    }
  }
  
  
}

export async function runAIWorkFlow(
  inputValue: string,
  inputType = "chat",
  outputType = "chat",
  stream = false
) {
  const flowIdOrName = "6c754945-8fa4-4c16-9058-66e251bd3881";
  const langflowId = "46a3dfea-9f48-4559-b35b-8fb5f147b871";
  const applicationToken = process.env.LANGFLOW_TOKEN
  const langflowClient = new LangflowClient(
    "https://api.langflow.astra.datastax.com",
    applicationToken
  );

  try {
    const tweaks = {};

    let response = await langflowClient.runFlow(
      flowIdOrName,
      langflowId,
      inputValue,
      inputType,
      outputType,
      tweaks,
      stream,
      (data: any) => console.log("Received:", data.chunk), // onUpdate
      (message: any) => console.log("Stream Closed:", message), // onClose
      (error: any) => console.log("Stream Error:", error) // onError
    );
    if (!stream && response && response.outputs) {
      const flowOutputs = response.outputs[0];
      const firstComponentOutputs = flowOutputs.outputs[0];
      const output = firstComponentOutputs.outputs.message;

      return output.message.text;
    }
  } catch (error) {
    console.error("Main Error", error.message);
  }
}