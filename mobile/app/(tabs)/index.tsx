import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  Receipt,
} from 'lucide-react-native';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { useLoans } from '../../hooks/useLoans';
import { Loan, LoanSummary } from '../../types';

export default function DashboardScreen() {
  const router = useRouter();
  const { summary, loans, isLoading, isRefreshing, errorMessage, refresh } = useLoans();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'REPAID'>('ALL');

  // Filter loans according to active filter
  const filteredLoans = loans.filter((loan) => {
    if (activeFilter === 'PENDING') return loan.status === 'PENDING';
    if (activeFilter === 'REPAID') return loan.status === 'REPAID';
    if (activeFilter === 'OVERDUE') return loan.status === 'PENDING' && loan.isOverdue;
    return true;
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (val?: string) => {
    if (!val) return '₹0.00';
    const num = parseFloat(val);
    if (isNaN(num)) return '₹' + val;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (isLoading && !summary) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F172A" />
        <Text style={styles.loadingText}>Loading your ledger...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor="#0F172A"
            colors={['#0F172A']}
          />
        }
      >
        {/* Error Notification */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color="#B91C1C" style={{ marginRight: 8 }} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Top Financial Summary Cards */}
        <View style={styles.summaryGrid}>
          {/* Main Outstanding Card */}
          <Card variant="elevated" style={styles.heroSummaryCard}>
            <View style={styles.heroHeader}>
              <View>
                <Text style={styles.heroLabel}>Total Outstanding</Text>
                <Text style={styles.heroAmount}>
                  {formatCurrency(summary?.outstandingAmount)}
                </Text>
              </View>
              <View style={styles.heroIconBadge}>
                <TrendingUp size={22} color="#0F172A" />
              </View>
            </View>
            <Text style={styles.heroSubtext}>
              {summary?.pendingCount || 0} active loan{(summary?.pendingCount || 0) === 1 ? '' : 's'} to friends
            </Text>
          </Card>

          {/* 3 Secondary Metric Cards */}
          <View style={styles.metricsRow}>
            {/* Total Lent */}
            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Lent</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(summary?.totalLent)}
              </Text>
              <Text style={styles.metricHint}>All time loans</Text>
            </Card>

            {/* Total Repaid */}
            <Card style={styles.metricCard}>
              <View style={styles.metricHeaderWithIcon}>
                <Text style={styles.metricLabel}>Total Repaid</Text>
                <CheckCircle2 size={13} color="#059669" />
              </View>
              <Text style={[styles.metricValue, styles.repaidValue]}>
                {formatCurrency(summary?.totalRepaid)}
              </Text>
              <Text style={styles.metricHint}>{summary?.repaidCount || 0} loans settled</Text>
            </Card>
          </View>

          {/* Overdue Alert Card (if any overdue amount) */}
          <Card
            style={[
              styles.overdueCard,
              Number(summary?.overdueAmount || 0) > 0 ? styles.overdueActive : styles.overdueInactive,
            ]}
          >
            <View style={styles.overdueLeft}>
              <View
                style={[
                  styles.overdueIconCircle,
                  Number(summary?.overdueAmount || 0) > 0
                    ? styles.overdueIconActive
                    : styles.overdueIconInactive,
                ]}
              >
                <AlertCircle
                  size={16}
                  color={Number(summary?.overdueAmount || 0) > 0 ? '#DC2626' : '#64748B'}
                />
              </View>
              <View>
                <Text style={styles.overdueLabel}>Overdue Amount</Text>
                <Text
                  style={[
                    styles.overdueAmountText,
                    Number(summary?.overdueAmount || 0) > 0 && styles.overdueTextActive,
                  ]}
                >
                  {formatCurrency(summary?.overdueAmount)}
                </Text>
              </View>
            </View>
            {Number(summary?.overdueAmount || 0) > 0 ? (
              <View style={styles.actionRequiredBadge}>
                <Text style={styles.actionRequiredText}>Needs Attention</Text>
              </View>
            ) : (
              <Text style={styles.allClearText}>All on track</Text>
            )}
          </Card>
        </View>

        {/* Loans Section Header & Filters */}
        <View style={styles.loansSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Loan Records</Text>
            <TouchableOpacity
              onPress={() => router.push('/add-loan')}
              style={styles.addLoanHeaderBtn}
            >
              <Plus size={16} color="#0F172A" />
              <Text style={styles.addLoanHeaderText}>Add Loan</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBar}
          >
            {(['ALL', 'PENDING', 'OVERDUE', 'REPAID'] as const).map((tab) => {
              const isSelected = activeFilter === tab;
              const count =
                tab === 'ALL'
                  ? loans.length
                  : tab === 'PENDING'
                  ? summary?.pendingCount || 0
                  : tab === 'REPAID'
                  ? summary?.repaidCount || 0
                  : loans.filter((l) => l.status === 'PENDING' && l.isOverdue).length;

              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveFilter(tab)}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextActive,
                    ]}
                  >
                    {tab.charAt(0) + tab.slice(1).toLowerCase()} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Loan List or Empty State */}
          {filteredLoans.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Receipt size={32} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>
                {activeFilter === 'ALL'
                  ? 'No loans recorded yet'
                  : `No ${activeFilter.toLowerCase()} loans`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'ALL'
                  ? 'Record money lent to friends to easily track due dates and settlements.'
                  : `There are currently no loans under the ${activeFilter.toLowerCase()} filter.`}
              </Text>
              {activeFilter === 'ALL' && (
                <Button
                  title="Add First Loan"
                  icon={<Plus size={18} color="#FFFFFF" />}
                  onPress={() => router.push('/add-loan')}
                  style={styles.emptyBtn}
                />
              )}
            </Card>
          ) : (
            <View style={styles.loanList}>
              {filteredLoans.map((loan) => (
                <TouchableOpacity
                  key={loan.id}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/loan/${loan.id}`)}
                >
                  <Card
                    style={[
                      styles.loanCard,
                      loan.isOverdue && loan.status === 'PENDING' && styles.loanCardOverdue,
                    ]}
                  >
                    <View style={styles.loanMainInfo}>
                      <View style={styles.friendAvatar}>
                        <Text style={styles.friendAvatarText}>
                          {loan.friendName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.loanDetails}>
                        <Text style={styles.friendName}>{loan.friendName}</Text>
                        <View style={styles.dateRow}>
                          <Clock size={12} color="#64748B" style={{ marginRight: 4 }} />
                          <Text style={styles.dueDateText}>
                            Due {formatDate(loan.dueDate)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.loanRightCol}>
                      <Text style={styles.loanAmount}>
                        {formatCurrency(loan.amount)}
                      </Text>
                      <View style={styles.badgeRow}>
                        <Badge
                          status={loan.status}
                          isOverdue={loan.isOverdue}
                        />
                        <ChevronRight size={16} color="#CBD5E1" style={{ marginLeft: 4 }} />
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/add-loan')}
        style={styles.fab}
      >
        <Plus size={22} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Loan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  summaryGrid: {
    marginBottom: 24,
    gap: 12,
  },
  heroSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  heroIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSubtext: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
  },
  metricHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  repaidValue: {
    color: '#059669',
  },
  metricHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  overdueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  overdueActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  overdueInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  overdueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  overdueIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overdueIconActive: {
    backgroundColor: '#FEE2E2',
  },
  overdueIconInactive: {
    backgroundColor: '#E2E8F0',
  },
  overdueLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  overdueAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  overdueTextActive: {
    color: '#DC2626',
  },
  actionRequiredBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionRequiredText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  allClearText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  loansSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  addLoanHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    gap: 4,
  },
  addLoanHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  loanList: {
    gap: 10,
  },
  loanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  loanCardOverdue: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFBFB',
  },
  loanMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  friendAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  loanDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 12,
    color: '#64748B',
  },
  loanRightCol: {
    alignItems: 'flex-end',
  },
  loanAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 280,
  },
  emptyBtn: {
    minWidth: 160,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 9999,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
