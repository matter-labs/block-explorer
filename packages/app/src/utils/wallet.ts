// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function processException(e: any, message: string) {
  if (e instanceof WalletError) {
    throw e;
  } else if (e?.code === 4001 || e?.code === "ACTION_REJECTED") {
    throw WalletError.TransactionRejected();
  } else if (e?.code === -32603) {
    throw WalletError.JsonRpcError(e?.data?.data?.message?.length ? e.data.data.message : e.message);
  } else if (e?.code === "SERVER_ERROR") {
    throw WalletError.InternalServerError();
  }
  throw WalletError.UnknownError(e?.message?.length ? e.message : message);
}

export class WalletError extends Error {
  messageCode;
  constructor(message: string, messageCode: string) {
    super(message);
    this.messageCode = messageCode;
    Object.setPrototypeOf(this, WalletError.prototype);
  }
  static NetworkChangeRejected() {
    return new WalletError("Network change rejected", "network_change_rejected");
  }
  static TransactionRejected() {
    return new WalletError("Transaction was rejected", "transaction_rejected");
  }
  static JsonRpcError(message = "JsonRpcError occurred") {
    return new WalletError(message, "json_rpc_error");
  }
  static InternalServerError(message = "Internal Server Error") {
    return new WalletError(message, "internal_server_error");
  }
  static UnknownError(message = "Unknown error occurred") {
    return new WalletError(message, "unknown_error_occurred");
  }
}
