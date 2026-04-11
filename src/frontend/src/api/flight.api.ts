import apiClient from '@api/axios-instance';
import { ApiPagedResult } from '@/types/common.types';
import { CreateFlightRequest, FlightDto, GetFlightsParams } from '@/types/flight.types';

export const flightApi = {
  getAll: (params: GetFlightsParams) =>
    apiClient.get<ApiPagedResult<FlightDto[]>>('/api/v1/flight/get-all', { params }),
  getById: (id: number) => apiClient.get<FlightDto>('/api/v1/flight/get-by-id', { params: { id } }),
  create: (data: CreateFlightRequest) => apiClient.post<FlightDto>('/api/v1/flight/create', data)
};
