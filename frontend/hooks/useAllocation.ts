import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AllocationSummaryResponse } from "@/types";

export const useAllocationSummary = (id: string) => {
  return useQuery({
    queryKey: ["allocation-summary", id],
    queryFn: async () => {
      const { data } = await api.get<AllocationSummaryResponse>(`/api/portfolios/${id}/allocation-summary`);
      return data;
    },
    enabled: !!id,
    staleTime: 0,
  });
};
