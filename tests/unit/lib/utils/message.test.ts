/**
 * Tests for showMessage() and handleApiError() — toast wrappers.
 *
 * We mock sonner to assert that the right toast variant fires.
 */
import { AxiosError, AxiosHeaders } from "axios";

const toastSuccess = jest.fn();
const toastError = jest.fn();

jest.mock("sonner", () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
  },
}));

import { showMessage, handleApiError } from "@/lib/utils/message";

describe("showMessage", () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  it("routes known SUCCESS keys to toast.success", () => {
    showMessage("REGISTER_SUCCESS");
    expect(toastSuccess).toHaveBeenCalledTimes(1);
    expect(toastError).not.toHaveBeenCalled();
  });

  it("routes unknown / error keys to toast.error", () => {
    showMessage("SOMETHING_FAILED");
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("translates the provided key (does not toast the raw key)", () => {
    showMessage("LOGIN_FAILED");
    expect(toastError).toHaveBeenCalled();
    const arg = toastError.mock.calls[0][0];
    expect(typeof arg).toBe("string");
  });
});

function makeAxiosError(data: unknown): AxiosError {
  return new AxiosError(
    "Request failed",
    "ERR_BAD_REQUEST",
    { headers: new AxiosHeaders() },
    null,
    {
      data,
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: { headers: new AxiosHeaders() },
    },
  );
}

describe("handleApiError", () => {
  beforeEach(() => {
    toastError.mockReset();
    toastSuccess.mockReset();
  });

  it("pulls `message` key from AxiosError response.data", () => {
    const err = makeAxiosError({ message: "INVALID_CREDENTIALS" });
    const result = handleApiError(err);
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(typeof result).toBe("string");
  });

  it("falls back to `error` field when `message` absent", () => {
    const err = makeAxiosError({ error: "SERVER_ERROR" });
    handleApiError(err);
    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it("falls back to UNKNOWN_ERROR when neither field is present", () => {
    const err = makeAxiosError({});
    handleApiError(err);
    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it("handles non-Axios errors with UNKNOWN_ERROR", () => {
    const result = handleApiError(new Error("boom"));
    expect(typeof result).toBe("string");
    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it("handles null / primitives safely", () => {
    handleApiError(null);
    expect(toastError).toHaveBeenCalledTimes(1);
    toastError.mockReset();
    handleApiError("just a string");
    expect(toastError).toHaveBeenCalledTimes(1);
  });
});
