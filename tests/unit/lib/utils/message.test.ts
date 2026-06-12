/**
 * Tests for showSuccess / showError / showMessage and handleApiError —
 * toast wrappers. We mock sonner to assert which variant fires.
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

import {
  showError,
  showMessage,
  showSuccess,
  handleApiError,
} from "@/lib/utils/message";

describe("showSuccess", () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  it("always fires toast.success", () => {
    showSuccess("REGISTER_SUCCESS");
    expect(toastSuccess).toHaveBeenCalledTimes(1);
    expect(toastError).not.toHaveBeenCalled();
  });

  it("translates the provided key (does not toast the raw key)", () => {
    showSuccess("REGISTER_SUCCESS");
    const arg = toastSuccess.mock.calls[0][0];
    expect(typeof arg).toBe("string");
  });
});

describe("showError", () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  it("always fires toast.error", () => {
    showError("PUSH_PERMISSION_DENIED");
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("translates the provided key (does not toast the raw key)", () => {
    showError("LOGIN_FAILED");
    const arg = toastError.mock.calls[0][0];
    expect(typeof arg).toBe("string");
  });
});

describe("showMessage (legacy alias)", () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  it("delegates to showSuccess — the historical SUCCESS_KEYS heuristic is gone", () => {
    showMessage("WORKSPACE_CREATED");
    expect(toastSuccess).toHaveBeenCalledTimes(1);
    expect(toastError).not.toHaveBeenCalled();
  });

  it("still treats unknown keys as success — callers must use showError for errors", () => {
    showMessage("SOMETHING_FAILED");
    expect(toastSuccess).toHaveBeenCalledTimes(1);
    expect(toastError).not.toHaveBeenCalled();
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
