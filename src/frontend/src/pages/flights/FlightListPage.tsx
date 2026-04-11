import {
  AppstoreOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import { Button, Select, Skeleton, Space, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { SorterResult } from 'antd/es/table/interface';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlightCard } from '@components/booking/FlightCard';
import { DataTable } from '@components/common/DataTable';
import { EmptyState } from '@components/common/EmptyState';
import { FilterBar } from '@components/common/FilterBar';
import { PageHeader } from '@components/common/PageHeader';
import { RouteBadge } from '@components/common/RouteBadge';
import { SearchInput } from '@components/common/SearchInput';
import { StatusPill } from '@components/common/StatusPill';
import { useGetAircrafts } from '@hooks/useAircrafts';
import { useGetAirports } from '@hooks/useAirports';
import { useGetFlights } from '@hooks/useFlights';
import { useIsDesktop } from '@hooks/useResponsive';
import { useAdminMode } from '@stores/auth.store';
import { AirportDto } from '@/types/airport.types';
import { FlightStatus } from '@/types/enums';
import { FlightDto, GetFlightsParams } from '@/types/flight.types';
import { flightStatusLabels, formatCurrency, formatDuration } from '@utils/format';
import {
  buildRouteDescriptor,
  formatDateLabel,
  formatQuerySyncLabel,
  formatScheduleStrip,
  getFlightStatusTone,
  getLatestQueryTimestamp,
  isFlightBookable
} from '@utils/presentation';

const { Text } = Typography;
const FLIGHT_RESULTS_PLACEHOLDER_COUNT = 3;

const resolveFlightOrderBy = (
  sorter: SorterResult<FlightDto> | undefined,
  fallback: string
): string => {
  const field = typeof sorter?.field === 'string' ? sorter.field : null;
  const columnKey = typeof sorter?.columnKey === 'string' ? sorter.columnKey : null;
  const candidate = field || columnKey;

  if (candidate === 'summary') {
    return 'flightDate';
  }

  if (candidate && ['id', 'flightNumber', 'price', 'flightDate'].includes(candidate)) {
    return candidate;
  }

  return fallback;
};

const FlightResultsPlaceholder = () => (
  <Space data-testid="flight-results-placeholder" direction="vertical" size={16} style={{ width: '100%' }}>
    {Array.from({ length: FLIGHT_RESULTS_PLACEHOLDER_COUNT }).map((_, index) => (
      <div key={index} className="app-surface" style={{ padding: 20, borderRadius: 24 }}>
        <Skeleton active title={{ width: '38%' }} paragraph={{ rows: 3 }} />
      </div>
    ))}
  </Space>
);

export const FlightListPage = () => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const adminMode = useAdminMode();
  const [params, setParams] = useState<GetFlightsParams>({
    page: 1,
    pageSize: 10,
    order: 'ASC',
    orderBy: 'flightDate',
    searchTerm: ''
  });

  const airportsQuery = useGetAirports();
  const aircraftsQuery = useGetAircrafts();
  const flightsQuery = useGetFlights(params);
  const flights = useMemo(() => flightsQuery.data?.data || [], [flightsQuery.data?.data]);

  const airportMap = useMemo(() => {
    const entries = (airportsQuery.data || []).map((airport) => [airport.id, airport] as const);
    return Object.fromEntries(entries) as Record<number, AirportDto>;
  }, [airportsQuery.data]);

  const airportOptions = useMemo(
    () =>
      (airportsQuery.data || []).map((airport) => ({
        label: `${airport.code} - ${airport.name}`,
        value: airport.id
      })),
    [airportsQuery.data]
  );

  const departureAirportOptions = useMemo(
    () => airportOptions.filter((airport) => airport.value !== params.arriveAirportId),
    [airportOptions, params.arriveAirportId]
  );

  const arriveAirportOptions = useMemo(
    () => airportOptions.filter((airport) => airport.value !== params.departureAirportId),
    [airportOptions, params.departureAirportId]
  );

  const aircraftMap = useMemo(() => {
    const entries = (aircraftsQuery.data || []).map((aircraft) => [aircraft.id, aircraft.name] as const);
    return Object.fromEntries(entries) as Record<number, string>;
  }, [aircraftsQuery.data]);
  const hasFlightsResult = Boolean(flightsQuery.data);
  const isInitialResultsLoad = flightsQuery.isLoading && !hasFlightsResult;
  const isResultsRefetching = flightsQuery.isFetching && hasFlightsResult;
  const shouldShowEmptyState =
    hasFlightsResult && !isInitialResultsLoad && !isResultsRefetching && flights.length === 0;
  const shouldShowMobilePlaceholder =
    isInitialResultsLoad || (!flights.length && isResultsRefetching);
  const resultsLoading =
    isInitialResultsLoad ||
    isResultsRefetching ||
    airportsQuery.isFetching ||
    aircraftsQuery.isFetching;
  const emptyState = (
    <EmptyState
      title="No flights found"
      description="No flights match the current filters."
      action={
        <Button
          onClick={() => {
            setParams({
              page: 1,
              pageSize: 10,
              order: 'ASC',
              orderBy: 'flightDate',
              searchTerm: '',
              departureAirportId: null,
              arriveAirportId: null,
              flightStatus: null
            });
          }}
        >
          Reset filters
        </Button>
      }
    />
  );

  const lastUpdatedAt = getLatestQueryTimestamp(
    airportsQuery.dataUpdatedAt,
    aircraftsQuery.dataUpdatedAt,
    flightsQuery.dataUpdatedAt
  );

  const columns: ColumnsType<FlightDto> = useMemo(
    () => [
      {
        title: 'Flight',
        key: 'summary',
        render: (_, record) => {
          const route = buildRouteDescriptor(
            airportMap[record.departureAirportId],
            airportMap[record.arriveAirportId],
            record.departureAirportId,
            record.arriveAirportId
          );

          return (
            <div style={{ display: 'grid', gap: 8, minWidth: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <Space direction="vertical" size={6}>
                  <Text
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontWeight: 700,
                      fontSize: 15
                    }}
                  >
                    {record.flightNumber}
                  </Text>
                  <RouteBadge
                    compact
                    fromCode={route.departure.code}
                    toCode={route.arrival.code}
                    fromName={route.departure.name}
                    toName={route.arrival.name}
                  />
                </Space>
                <StatusPill
                  label={flightStatusLabels[record.flightStatus]}
                  tone={getFlightStatusTone(record.flightStatus)}
                />
              </div>
              <Text type="secondary">{`${formatDateLabel(record.flightDate)} · ${formatScheduleStrip(record.departureDate, record.arriveDate)} · ${formatDuration(record.durationMinutes)}`}</Text>
            </div>
          );
        },
        sorter: true
      },
      {
        title: 'Base fare',
        dataIndex: 'price',
        key: 'price',
        width: 140,
        render: (value: number) => (
          <Space direction="vertical" size={0}>
            <Text strong>{formatCurrency(value)}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Before seat lock
            </Text>
          </Space>
        ),
        sorter: true
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 170,
        render: (_, record) => {
          const bookable = isFlightBookable(record);

          return (
            <Space size="small">
              <Button icon={<EyeOutlined />} onClick={() => navigate(`/flights/${record.id}`)} />
              <Button
                type="primary"
                ghost
                icon={<ShoppingCartOutlined />}
                disabled={!bookable}
                onClick={() => navigate(`/bookings/create?flightId=${record.id}`)}
              />
              {adminMode && (
                <Button icon={<AppstoreOutlined />} onClick={() => navigate(`/flights/${record.id}/seats`)} />
              )}
            </Space>
          );
        }
      }
    ],
    [airportMap, adminMode, navigate]
  );

  const handleDepartureAirportChange = (value?: number) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      departureAirportId: value ?? null,
      arriveAirportId: prev.arriveAirportId === value ? null : prev.arriveAirportId
    }));
  };

  const handleArrivalAirportChange = (value?: number) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      arriveAirportId: value ?? null,
      departureAirportId: prev.departureAirportId === value ? null : prev.departureAirportId
    }));
  };

  const handleStatusFilterChange = (value: FlightStatus | 'all') => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      flightStatus: value === 'all' ? null : value
    }));
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<FlightDto> | SorterResult<FlightDto>[]
  ) => {
    const sorterObject = Array.isArray(sorter) ? sorter[0] : sorter;
    const orderBy = resolveFlightOrderBy(sorterObject, params.orderBy || 'flightDate');
    const order = sorterObject?.order === 'descend' ? 'DESC' : 'ASC';

    setParams((prev) => ({
      ...prev,
      page: pagination.current ?? 1,
      pageSize: pagination.pageSize ?? 10,
      orderBy,
      order
    }));
  };

  return (
    <>
      <PageHeader
        eyebrow="Flight ops"
        title="Flight list"
        subtitle="Table-first on desktop, card-first on mobile. Each record emphasizes route, schedule, base fare, and status instead of showing only raw columns."
        meta={formatQuerySyncLabel(lastUpdatedAt)}
        extra={
          adminMode ? (
            <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => navigate('/flights/create')}>
              Create new
            </Button>
          ) : null
        }
      />

      <FilterBar
        summary={`${flights.length} visible / ${flightsQuery.data?.total || 0} total · sort ${params.orderBy}:${params.order}`}
        actions={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                flightsQuery.refetch();
                airportsQuery.refetch();
                aircraftsQuery.refetch();
              }}
            >
              Refresh
            </Button>
            <Button
              onClick={() => {
                setParams({
                  page: 1,
                  pageSize: 10,
                  order: 'ASC',
                  orderBy: 'flightDate',
                  searchTerm: '',
                  departureAirportId: null,
                  arriveAirportId: null,
                  flightStatus: null
                });
              }}
            >
              Clear filters
            </Button>
          </Space>
        }
      >
        <SearchInput
          placeholder="Search by flight number"
          value={params.searchTerm || ''}
          onSearch={(value) =>
            setParams((prev) => {
              const nextSearchTerm = value || '';
              const currentSearchTerm = prev.searchTerm || '';
              if (currentSearchTerm === nextSearchTerm) {
                return prev;
              }

              return { ...prev, searchTerm: nextSearchTerm, page: 1 };
            })
          }
          style={{ width: 280 }}
        />
        <Select
          allowClear
          size="large"
          style={{ width: 220 }}
          placeholder="Departure airport"
          value={params.departureAirportId ?? undefined}
          options={departureAirportOptions}
          loading={airportsQuery.isLoading}
          onChange={handleDepartureAirportChange}
        />
        <Select
          allowClear
          size="large"
          style={{ width: 220 }}
          placeholder="Arrival airport"
          value={params.arriveAirportId ?? undefined}
          options={arriveAirportOptions}
          loading={airportsQuery.isLoading}
          onChange={handleArrivalAirportChange}
        />
        <Select
          size="large"
          style={{ width: 220 }}
          value={params.flightStatus ?? 'all'}
          options={[
            { label: 'All statuses', value: 'all' },
            ...Object.values(FlightStatus)
              .filter((value) => typeof value === 'number')
              .map((status) => ({
                label: flightStatusLabels[status as FlightStatus],
                value: status as FlightStatus
              }))
          ]}
          onChange={handleStatusFilterChange}
        />
      </FilterBar>

      {!isDesktop ? (
        shouldShowEmptyState ? (
          emptyState
        ) : shouldShowMobilePlaceholder ? (
          <FlightResultsPlaceholder />
        ) : (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {flights.map((flight) => (
              <FlightCard
                key={flight.id}
                flight={flight}
                airportsMap={airportMap}
                aircraftName={aircraftMap[flight.aircraftId]}
                actionSlot={
                  <Space wrap>
                    <Button icon={<EyeOutlined />} onClick={() => navigate(`/flights/${flight.id}`)}>
                      Details
                    </Button>
                    <Button
                      type="primary"
                      disabled={!isFlightBookable(flight)}
                      onClick={() => navigate(`/bookings/create?flightId=${flight.id}`)}
                      icon={<ShoppingCartOutlined />}
                    >
                      Book now
                    </Button>
                  </Space>
                }
              />
            ))}
          </Space>
        )
      ) : (
        <DataTable<FlightDto>
          loading={resultsLoading}
          columns={columns}
          dataSource={flights}
          locale={{
            emptyText: shouldShowEmptyState ? emptyState : <span />
          }}
          onChange={handleTableChange}
          pagination={{
            current: flightsQuery.data?.page || 1,
            pageSize: flightsQuery.data?.pageSize || 10,
            total: flightsQuery.data?.total || 0,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50']
          }}
        />
      )}
    </>
  );
};
