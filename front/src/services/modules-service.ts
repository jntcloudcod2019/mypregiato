import api from '@/services/whatsapp-api';

export type ModuleRecord = {
  id: string;
  moduleSlug: string;
  title?: string;
  status?: string;
  tags?: string;
  payloadJson: string;
  createdAtUtc?: string;
  updatedAtUtc?: string;
};

export const modulesApi = {
  list: async (module?: string, page = 1, pageSize = 20) => {
    const { data } = await api.get(`/modules`, { params: { module, page, pageSize } });
    return data as { items: ModuleRecord[]; total: number };
  },
  create: async (record: Partial<ModuleRecord>) => {
    const { data } = await api.post(`/modules`, record);
    return data as ModuleRecord;
  },
  update: async (id: string, record: Partial<ModuleRecord>) => {
    const { data } = await api.put(`/modules/${id}`, record);
    return data as ModuleRecord;
  },
  delete: async (id: string) => {
    await api.delete(`/modules/${id}`);
  }
};


