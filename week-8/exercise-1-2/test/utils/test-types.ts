export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error_code?: string;
  errors?: Array<{ field: string; message: string }>;
}
