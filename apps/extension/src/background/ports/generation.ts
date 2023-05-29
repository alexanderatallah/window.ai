import {
    ErrorCode,
    type InferredOutput,
    type Input,
    type RequestID,
    isMessagesInput
  } from "window.ai"
  import type { PlasmoMessaging } from "@plasmohq/messaging"
  
  import {
    POPUP_HEIGHT,
    POPUP_WIDTH,
    type PortRequest,
    type PortResponse,
    RequestInterruptType
  } from "~core/constants"
  import { PortName } from "~core/constants"
  import { Extension } from "~core/extension"
  import { type Config, configManager } from "~core/managers/config"
  import {
    type Transaction,
    transactionManager
  } from "~core/managers/transaction"
  import * as modelRouter from "~core/model-router"
  import {
    type Err,
    type Result,
    err,
    isErr,
    isOk,
    ok
  } from "~core/utils/result-monad"
  import { log } from "~core/utils/utils"
  
  import { requestPermission } from "./permission"
  
  const handler: PlasmoMessaging.PortHandler<
    PortRequest[PortName.Generation],
    PortResponse[PortName.Generation]
  > = async (req, res) => {
    log("Background received message: ", req)
  
    if (!req.body) {
      return res.send(err(ErrorCode.InvalidRequest))
    }
  
    const { id, request } = req.body
  
    const permit = await requestPermission(request, id)
    if (isErr(permit)) {
      return res.send({ response: permit, id })
    }
  
    const txn = request.transaction
    const config = await configManager.forModelWithDefault(txn.model)
  
    const predictedModel = await _getCompletionModel(config, txn)
    if (!isOk(predictedModel)) {
      _maybeInterrupt(id, predictedModel)
      return res.send({ response: predictedModel, id })
    }
    txn.routedModel = predictedModel.data
  
    await transactionManager.save(txn)
  
    // if (await modelRouter.shouldStream(config, request)) {
    //   const replies: string[] = []
    //   const errors: string[] = []
  
    //   const results = await modelRouter.stream(config, txn)
  
    //   for await (const result of results) {
    //     if (isOk(result)) {
    //       const outputs = [_getOutput(txn.input, result.data, true)]
    //       res.send({ response: ok(outputs), id })
    //       replies.push(result.data)
    //     } else {
    //       res.send({ response: result, id })
    //       errors.push(result.error)
    //       _maybeInterrupt(id, result)
    //     }
    //   }
  
    //   // Collect the replies and errors onto the txn
    //   txn.outputs = replies.length
    //     ? [_getOutput(txn.input, replies.join(""))]
    //     : undefined
    //   txn.error = errors.join("") || undefined
  
    //   // Send the final output to the client, as non-partial
    //   if (txn.outputs) {
    //     res.send({ response: ok(txn.outputs), id })
    //   }
    // } else {
    //   // TODO remove this code and make everything use modelRouter.stream
    //   // WIP PR: https://github.com/alexanderatallah/window.ai/pull/50
    // use fetch for the api request only
    //   post https://35c5-35-185-211-5.ngrok-free.app/generate with {prompt: "prompt"}
    console.log("INPUT", txn.input)
    const result =  await fetch("https://e45f-35-185-211-5.ngrok-free.app/generation", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(txn.input),
    })
    .then((response) => response.json())
    .then((data) => {
        console.log("Success:", data);
        return data
    })
    .catch((error) => {
        console.error("Error:", error);
    });
    console.log(result)

        // {
        //     "prompt": txn.input,
        // },
        // {
        //     headers: {
        //         "Content-Type": "application/json",
        //     },
        // })
        // log("result", result)
    // console.log(result)

        // const outputs: [String] = [result.data.url]
        res.send({ response: ok([result]), id })
  
    //   if (isOk(result)) {
    //     // const outputs = result.data.map((d) => _getOutput(txn.input, d))
        
    //     res.send({ response: ok(outputs), id })
    //     txn.outputs = outputs
    //   } else {
    //     res.send({ response: result, id })
    //     txn.error = result.error
    //     _maybeInterrupt(id, result)
    //   }
    // // }
  
    // Update the completion with the reply and model used
    // await transactionManager.save(txn)
  }
  
  async function _getCompletionModel(
    config: Config,
    txn: Transaction
  ): Promise<Result<string, string>> {
    if (txn.model) {
      return ok(txn.model)
    }
    return configManager.predictModel(config, txn)
  }
  
  function _getOutput(
    input: Input,
    result: string,
    isPartial?: boolean
  ): InferredOutput<typeof input> {
    return isMessagesInput(input)
      ? { message: { role: "assistant", content: result }, isPartial }
      : { text: result, isPartial }
  }
  
  async function _maybeInterrupt(id: RequestID, result: Err<ErrorCode | string>) {
    if (result.error === ErrorCode.NotAuthenticated) {
      return _requestInterrupt(id, RequestInterruptType.Authentication)
    } else if (result.error === ErrorCode.PaymentRequired) {
      return _requestInterrupt(id, RequestInterruptType.Payment)
    }
  }
  
  async function _requestInterrupt(
    requestId: RequestID,
    type: RequestInterruptType
  ) {
    await Extension.openPopup(POPUP_WIDTH, POPUP_HEIGHT, {
      requestInterruptType: type,
      requestId
    })
  }
  
  export default handler
  