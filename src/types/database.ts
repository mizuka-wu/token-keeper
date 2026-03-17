export interface Group {
  id: number;
  name: string;
  description?: string;
  active: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Token {
  id: number;
  name: string;
  value: string;
  env_name?: string;
  description?: string;
  tags?: string[] | string;
  website?: string;
  expired_at?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface GroupToken {
  id: number;
  group_id: number;
  token_id: number;
  created_at: string;
}

export interface TokenWithGroups extends Token {
  groups?: Group[];
}

export interface GroupWithTokens extends Group {
  tokens?: Token[];
}
