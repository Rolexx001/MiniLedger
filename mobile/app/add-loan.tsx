import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Calendar, Check, AlertCircle } from 'lucide-react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { loansApi, getErrorMessage } from '../lib/api';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

// Zod validation schema for Add Loan Form
const addLoanSchema = z.object({
  friendName: z
    .string()
    .trim()
    .min(1, 'Friend name is required')
    .max(100, 'Friend name must be under 100 characters'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Enter a valid positive amount')
    .refine((val) => {
      const num = parseFloat(val);
      return num <= 10000000;
    }, 'Amount cannot exceed ₹10,000,000'),
  dueDate: z
    .string()
    .min(1, 'Due date is required')
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid due date format (YYYY-MM-DD)'),
});

type AddLoanFormData = z.infer<typeof addLoanSchema>;

export default function AddLoanScreen() {
  const router = useRouter();
  const [selectedPresetDays, setSelectedPresetDays] = useState<number | null>(7);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default due date: 7 days from now
  const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddLoanFormData>({
    resolver: zodResolver(addLoanSchema),
    defaultValues: {
      friendName: '',
      amount: '',
      dueDate: defaultDueDate,
    },
  });

  const currentAmount = watch('amount');

  const handlePresetDays = (days: number) => {
    setSelectedPresetDays(days);
    const target = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setValue('dueDate', target.toISOString().split('T')[0], { shouldValidate: true });
  };

  const onSubmit = async (data: AddLoanFormData) => {
    if (isSubmitting) return; // Concurrency protection
    setIsSubmitting(true);
    setServerError('');

    try {
      await loansApi.createLoan({
        friendName: data.friendName.trim(),
        amount: parseFloat(data.amount),
        dueDate: new Date(data.dueDate).toISOString(),
      });

      if (Platform.OS === 'web') {
        router.back();
      } else {
        Alert.alert(
          'Loan Recorded',
          `Successfully recorded ₹${parseFloat(data.amount).toLocaleString('en-IN')} lent to ${data.friendName.trim()}`,
          [
            {
              text: 'Done',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {serverError ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color="#B91C1C" style={{ marginRight: 8 }} />
            <Text style={styles.errorBannerText}>{serverError}</Text>
          </View>
        ) : null}

        <Card variant="elevated" style={styles.formCard}>
          <Text style={styles.sectionTitle}>Loan Information</Text>

          {/* Friend Name Controller */}
          <Controller
            control={control}
            name="friendName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Who are you lending to?"
                placeholder="e.g. Rahul, Priya, Alex"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.friendName?.message}
                leftIcon={<User size={18} color="#64748B" />}
              />
            )}
          />

          {/* Amount Controller */}
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Loan Amount"
                prefix="₹"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={value}
                onBlur={onBlur}
                onChangeText={(text) => {
                  const sanitized = text.replace(/[^0-9.]/g, '');
                  onChange(sanitized);
                }}
                error={errors.amount?.message}
              />
            )}
          />

          {/* Quick Amount Suggestion Pills */}
          <View style={styles.quickAmountsContainer}>
            <Text style={styles.quickLabel}>Quick amounts:</Text>
            <View style={styles.quickPillsRow}>
              {QUICK_AMOUNTS.map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setValue('amount', val.toString(), { shouldValidate: true })}
                  style={[
                    styles.quickPill,
                    currentAmount === val.toString() && styles.quickPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.quickPillText,
                      currentAmount === val.toString() && styles.quickPillTextActive,
                    ]}
                  >
                    +₹{val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Due Date Presets & Custom Input */}
          <View style={styles.dueSection}>
            <Text style={styles.fieldLabel}>When should this be repaid?</Text>
            <View style={styles.presetRow}>
              {[
                { label: 'In 3 Days', days: 3 },
                { label: 'In 1 Week', days: 7 },
                { label: 'In 15 Days', days: 15 },
                { label: 'In 1 Month', days: 30 },
              ].map((p) => {
                const isSelected = selectedPresetDays === p.days;
                return (
                  <TouchableOpacity
                    key={p.days}
                    onPress={() => handlePresetDays(p.days)}
                    style={[
                      styles.presetChip,
                      isSelected && styles.presetChipActive,
                    ]}
                  >
                    {isSelected && (
                      <Check size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    )}
                    <Text
                      style={[
                        styles.presetChipText,
                        isSelected && styles.presetChipTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Due Date Controller */}
            <Controller
              control={control}
              name="dueDate"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Due Date (YYYY-MM-DD)"
                  placeholder="YYYY-MM-DD"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    onChange(text);
                    setSelectedPresetDays(null);
                  }}
                  error={errors.dueDate?.message}
                  leftIcon={<Calendar size={18} color="#64748B" />}
                  helperText="Specify the agreed date of return."
                />
              )}
            />
          </View>

          {/* Submit Button */}
          <Button
            title={isSubmitting ? 'Recording Loan...' : 'Record Loan'}
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            size="lg"
            style={styles.submitBtn}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
  },
  quickAmountsContainer: {
    marginBottom: 18,
    marginTop: -8,
  },
  quickLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '500',
  },
  quickPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  quickPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  quickPillTextActive: {
    color: '#FFFFFF',
  },
  dueSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    marginTop: 12,
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
});
