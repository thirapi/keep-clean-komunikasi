type ErrorResponseType = {
    message: string;
    type: string;
    meta?: any;
};

export type ServerResponse<T> = {
    status: "success" | "error";
    data: T;
    error: ErrorResponseType | null;
};
