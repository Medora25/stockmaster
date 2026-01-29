import { AccountSettings } from '@/core/types';
import { AccountKey } from './types';
import { TFunction } from 'i18next';

export const getAccountCode = (key: AccountKey | string, settings?: AccountSettings): string => {
  if (!settings) return key;
  switch (key) {
    case 'CLIENTS': return settings.clientAccount;
    case 'FOURNISSEURS': return settings.supplierAccount;
    case 'CAISSE': return settings.cashAccount;
    case 'VENTES': return settings.salesAccount;
    case 'ACHATS': return settings.purchasesAccount;
    case 'TVA_COLLECTEE': return settings.vatCollectedAccount;
    case 'TVA_DEDUCTIBLE': return settings.vatDeductibleAccount;
    case 'BANQUE': return settings.bankAccount;
    case 'DEPENSES_AUTRES': return settings.expensesAccount || '61xx';
    case 'RESULTAT_ANTERIEUR': return '1191';
    default: return key.match(/^\d+/) ? key.split(' ')[0] : key;
  }
};

export const getAccountLabel = (key: AccountKey | string, t: TFunction, settings?: AccountSettings): string => {
  const code = getAccountCode(key, settings);
  let name = key;
  switch (key) {
    case 'CLIENTS': name = t('accounting.accounts.clients'); break;
    case 'FOURNISSEURS': name = t('accounting.accounts.suppliers'); break;
    case 'CAISSE': name = t('accounting.accounts.cash'); break;
    case 'VENTES': name = t('accounting.accounts.sales'); break;
    case 'ACHATS': name = t('accounting.accounts.purchases'); break;
    case 'TVA_COLLECTEE': name = t('accounting.accounts.vatCollected'); break;
    case 'TVA_DEDUCTIBLE': name = t('accounting.accounts.vatDeductible'); break;
    case 'BANQUE': name = 'Banque'; break;
    case 'DEPENSES_AUTRES': name = t('accounting.accounts.expenses'); break;
    case 'RESULTAT_ANTERIEUR': name = 'Report à Nouveau'; break;
    default: name = key;
  }
  
  // If key is same as code (manual entry), don't duplicate
  if (key === code) {
     return code;
  }

  return code ? `${code} - ${name}` : name;
};
