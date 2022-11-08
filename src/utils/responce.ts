export function success(message: string, data: any, statusCode: number = 200) {
  return {
    message,
    data,
    statusCode
  }
}

export function error(error: any, statusCode: number = 500) {
  return {
    message: "Something Went Wrong.",
    error,
    statusCode
  }
}

export function validation(data: string) {
  return {
    statusCode: 400,
    message: "Validation Error.",
    data
  }
}