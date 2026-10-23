import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Loan, LoanSummary, CreateLoanPayload } from '../types';
import { loansApi, getErrorMessage } from '../lib/api';

export function useLoans() {
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fetchAll = useCallback(async (isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setIsRefreshing(true);
    }
    setErrorMessage('');

    try {
      const [summaryRes, loansRes] = await Promise.all([
        loansApi.getSummary(),
        loansApi.getLoans(),
      ]);
      setSummary(summaryRes);
      setLoans(loansRes.loans || []);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Automatically refresh when screen regains focus
  useFocusEffect(
    useCallback(() => {
      fetchAll(false);
    }, [fetchAll])
  );

  const refresh = useCallback(() => {
    return fetchAll(true);
  }, [fetchAll]);

  const recordLoan = async (payload: CreateLoanPayload) => {
    const res = await loansApi.createLoan(payload);
    await fetchAll(false);
    return res.loan;
  };

  const settleLoan = async (loanId: string) => {
    const res = await loansApi.repayLoan(loanId);
    await fetchAll(false);
    return res.loan;
  };

  return {
    summary,
    loans,
    isLoading,
    isRefreshing,
    errorMessage,
    refresh,
    recordLoan,
    settleLoan,
  };
}

export default useLoans;
