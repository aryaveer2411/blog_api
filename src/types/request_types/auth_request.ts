export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface RegisterRequestBody {
  first_name: string;
  last_name: string;
  dob: Date;
  email: string;
  password: string;
}

export interface ChangePasswordRequestBody {
  old_password: string;
  new_password: string;
}