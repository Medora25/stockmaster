export type AccountKey =
  | 'CLIENTS'
  | 'FOURNISSEURS'
  | 'CAISSE'
  | 'BANQUE'
  | 'VENTES'
  | 'ACHATS'
  | 'TVA_COLLECTEE'
  | 'TVA_DEDUCTIBLE'
  | 'DEPENSES_AUTRES'
  | 'RESULTAT_ANTERIEUR';

export interface JournalEntry {
  date: string;
  type: string;
  reference: string;
  description?: string;
  debitAccount: AccountKey;
  debitAmount: number;
  creditAccount: AccountKey;
  creditAmount: number;
}
