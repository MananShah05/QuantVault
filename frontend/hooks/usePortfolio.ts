import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PortfolioListItem, Portfolio, AssetSearchResult } from "@/types";

export const usePortfolios = () => {
  return useQuery({
    queryKey: ["portfolios"],
    queryFn: async () => {
      const { data } = await api.get<PortfolioListItem[]>("/api/portfolios");
      return data;
    },
  });
};

export const usePortfolio = (id: string) => {
  return useQuery({
    queryKey: ["portfolio", id],
    queryFn: async () => {
      const { data } = await api.get<Portfolio>(`/api/portfolios/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreatePortfolio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; assets: { ticker: string; weight: number }[] }) => {
      const { data } = await api.post("/api/portfolios", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });
};

export const useDeletePortfolio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/portfolios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });
};

export const useAssetSearch = (query: string) => {
  return useQuery({
    queryKey: ["assetSearch", query],
    queryFn: async () => {
      const { data } = await api.get<AssetSearchResult[]>(`/api/assets/search?q=${query}`);
      return Array.isArray(data) && data.length > 0 ? data[0] : undefined;
    },
    enabled: query.length >= 2,
    retry: false,
  });
};
