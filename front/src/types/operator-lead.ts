// Interface unificada para OperatorLead
export interface OperatorLead {
  nameLead: string;
  phoneLead: string;
  responsible?: string | null;
  age?: number | null;
  publicADS?: string | null;
}

export interface LeadsResponse {
  success: boolean;
  data: OperatorLead[];
  count: number;
  message: string;
}
