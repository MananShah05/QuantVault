import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MetricsResponse, SnapshotResponse, ComputeResult } from "@/types";

export const useComputeMetrics = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ComputeResult>(`/api/portfolios/${id}/compute`);
      return data;
    },
    onSuccess: () => {
      // id from outer scope is correct because the hook is called per portfolio
      queryClient.invalidateQueries({ queryKey: ["portfolio", id] });
      queryClient.invalidateQueries({ queryKey: ["metrics", id] });
      queryClient.invalidateQueries({ queryKey: ["snapshot", id] });
      queryClient.invalidateQueries({ queryKey: ["allocation-summary", id] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });
};

export const usePortfolioMetrics = (id: string, range: string) => {
  return useQuery({
    queryKey: ["metrics", id, range],
    queryFn: async () => {
      const { data } = await api.get<MetricsResponse>(`/api/portfolios/${id}/metrics?range=${range}`);
      return data;
    },
    enabled: !!id && !!range,
    staleTime: 0,
  });
};

export const usePortfolioSnapshot = (id: string, range: string = "6M") => {
  return useQuery({
    queryKey: ["snapshot", id, range],
    queryFn: async () => {
      const { data } = await api.get<SnapshotResponse>(`/api/portfolios/${id}/snapshot?range=${range}`);
      return data;
    },
    enabled: !!id && !!range,
    staleTime: 0,
  });
};
