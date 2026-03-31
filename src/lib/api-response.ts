

import { NextResponse } from "next/server";

import type { IApiResponse, IPagination, IPaginatedResponse } from "@/types";


export function successResponse<T>(
  data: T,
  message = "Success",
  statusCode = 200,
): NextResponse<IApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      statusCode,
    },
    { status: statusCode },
  );
}


export function errorResponse(
  message = "Something went wrong",
  statusCode = 500,
  errors?: Record<string, string[]> | string[],
): NextResponse<IApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      message,
      data: null,
      errors,
      statusCode,
    },
    { status: statusCode },
  );
}


export function paginatedResponse<T>(
  data: T,
  pagination: IPagination,
  message = "Success",
  statusCode = 200,
): NextResponse<IPaginatedResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      pagination,
      statusCode,
    },
    { status: statusCode },
  );
}


export function buildPagination(
  page: number,
  limit: number,
  total: number,
): IPagination {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}


export function createdResponse<T>(
  data: T,
  message = "Created successfully",
): NextResponse<IApiResponse<T>> {
  return successResponse(data, message, 201);
}


export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
