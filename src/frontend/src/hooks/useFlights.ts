import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { flightApi } from '@api/flight.api';
import { CreateFlightRequest, FlightDto, GetFlightsParams } from '@/types/flight.types';
import { AppError, PagedResult } from '@/types/common.types';
import { buildPaginationParams, normalizeProblemError } from '@utils/helpers';

export const flightKeys = {
  all: ['flights'] as const,
  list: (params: GetFlightsParams) => ['flights', 'list', params] as const,
  detail: (id: number) => ['flights', 'detail', id] as const
};

const buildGetFlightsParams = (params: GetFlightsParams): GetFlightsParams => {
  const pagination = buildPaginationParams(params);

  return {
    ...pagination,
    departureAirportId:
      typeof params.departureAirportId === 'number' && params.departureAirportId > 0
        ? params.departureAirportId
        : undefined,
    arriveAirportId:
      typeof params.arriveAirportId === 'number' && params.arriveAirportId > 0 ? params.arriveAirportId : undefined,
    flightStatus: typeof params.flightStatus === 'number' ? params.flightStatus : undefined
  };
};

const toUiPagedResult = (
  params: GetFlightsParams,
  apiData: { result: FlightDto[] | null; total: number }
): PagedResult<FlightDto[]> => {
  const pagination = buildPaginationParams(params);
  return {
    data: apiData.result ?? [],
    total: apiData.total,
    page: pagination.page,
    pageSize: pagination.pageSize
  };
};

export const useGetFlights = (params: GetFlightsParams) =>
  useQuery({
    queryKey: flightKeys.list(buildGetFlightsParams(params)),
    queryFn: async () => {
      const requestParams = buildGetFlightsParams(params);
      const response = await flightApi.getAll(requestParams);
      return toUiPagedResult(requestParams, response.data);
    },
    placeholderData: (previousData) => previousData
  });

type UseGetFlightByIdOptions = {
  enabled?: boolean;
  retry?: boolean | number;
  refetchOnWindowFocus?: boolean;
};

export const useGetFlightById = (id: number, options?: UseGetFlightByIdOptions) =>
  useQuery({
    queryKey: flightKeys.detail(id),
    queryFn: async () => {
      const response = await flightApi.getById(id);
      return response.data;
    },
    enabled: (options?.enabled ?? true) && id > 0,
    retry: options?.retry,
    refetchOnWindowFocus: options?.refetchOnWindowFocus
  });

export const useCreateFlight = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const getCreateFlightErrorMessage = (appError: AppError): string => {
    if (appError.status === 409) {
      return 'Số hiệu chuyến bay đã tồn tại trong ngày đã chọn';
    }

    if (appError.status === 400) {
      if (appError.message.includes('durationMinutes must match departureDate and arriveDate')) {
        return 'Thời gian bay phải khớp với giờ khởi hành và giờ đến (đã tự tính lại theo phút).';
      }

      if (appError.message.includes('flightDate must match departureDate calendar day')) {
        return 'Ngày bay phải trùng với ngày khởi hành.';
      }

      if (appError.message.includes('must be after departureDate')) {
        return 'Giờ đến phải sau giờ khởi hành.';
      }

      if (appError.message.includes('must be different from departureAirportId')) {
        return 'Sân bay đến phải khác sân bay đi.';
      }

      if (appError.message.includes('flightStatus') && appError.message.includes('UNKNOWN')) {
        return 'Trạng thái chuyến bay không hợp lệ.';
      }
    }

    if (appError.status === 404) {
      if (appError.message.includes('Aircraft not found')) {
        return 'Không tìm thấy máy bay đã chọn.';
      }

      if (appError.message.includes('Departure airport not found')) {
        return 'Không tìm thấy sân bay đi đã chọn.';
      }

      if (appError.message.includes('Arrival airport not found')) {
        return 'Không tìm thấy sân bay đến đã chọn.';
      }
    }

    if (appError.message && appError.message !== 'Có lỗi xảy ra') {
      return appError.message;
    }

    return 'Tạo chuyến bay thất bại. Vui lòng kiểm tra dữ liệu và thử lại.';
  };

  return useMutation({
    mutationFn: async (payload: CreateFlightRequest) => {
      const response = await flightApi.create(payload);
      return response.data;
    },
    onSuccess: () => {
      message.success('Tạo chuyến bay thành công');
      queryClient.invalidateQueries({ queryKey: flightKeys.all });
      navigate('/flights');
    },
    onError: (error) => {
      const appError = normalizeProblemError(error);
      message.error(getCreateFlightErrorMessage(appError));
    }
  });
};
