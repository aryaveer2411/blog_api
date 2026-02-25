export interface RegisterUserDto {
    first_name: string;
    last_name: string;
    dob: Date;
    password: string;
    email:string
}

export interface LoginUserDto{
    email: string;
    password: string;
}