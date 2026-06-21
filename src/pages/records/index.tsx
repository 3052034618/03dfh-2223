import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import TempStatusBadge from '@/components/TempStatusBadge'
import { useReceiptStore } from '@/store/receipt'
import {
  formatDateTime,
  formatDate,
  getConclusionLabel,
  getConclusionColor,
  getSyncStatusBizLabel,
  getSyncStatusColor
} from '@/utils/format'
import type { TempStatus, ReceiptConclusion, ReceiptRecord, SearchFilters } from '@/types/coldchain'

type FilterType = 'all' | 'pending_sync' | TempStatus | ReceiptConclusion

const quickFilters: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending_sync', label: '待回传' },
  { key: 'normal', label: '温度达标' },
  { key: 'warning', label: '温度偏高' },
  { key: 'abnormal', label: '温度异常' },
  { key: 'accepted', label: '正常接收' },
  { key: 'partial_rejected', label: '部分拒收' },
  { key: 'pending_supervisor', label: '待主管确认' }
]

const RecordsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [onlyAbnormal, setOnlyAbnormal] = useState(false)
  const [onlyPendingSupervisor, setOnlyPendingSupervisor] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const records = useReceiptStore(state => state.records)
  const searchRecords = useReceiptStore(state => state.searchRecords)
  const retrySync = useReceiptStore(state => state.retrySync)
  const retryAllFailed = useReceiptStore(state => state.retryAllFailed)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  useDidShow(() => {
    const pendingFilter = (Taro as any).__pendingRecordsFilter as {
      dateFrom?: string; dateTo?: string;
      tempStatus?: string; conclusion?: string;
      syncStatus?: string; onlyAbnormal?: boolean;
    } | undefined

    if (pendingFilter) {
      ;(Taro as any).__pendingRecordsFilter = undefined
      if (pendingFilter.dateFrom) setDateFrom(pendingFilter.dateFrom)
      if (pendingFilter.dateTo) setDateTo(pendingFilter.dateTo)
      if (pendingFilter.onlyAbnormal) setOnlyAbnormal(true)
      if (pendingFilter.conclusion === 'partial_rejected') setActiveFilter('partial_rejected')
      else if (pendingFilter.conclusion === 'pending_supervisor') setActiveFilter('pending_supervisor')
      else if (pendingFilter.conclusion === 'accepted') setActiveFilter('accepted')
      if (pendingFilter.tempStatus === 'abnormal') setActiveFilter('abnormal')
      else if (pendingFilter.tempStatus === 'warning') setActiveFilter('warning')
      else if (pendingFilter.tempStatus === 'normal') setActiveFilter('normal')
      if (pendingFilter.syncStatus === 'failed') setActiveFilter('pending_sync')
      setShowFilters(true)
    }
  })

  const searchFilters = useMemo<SearchFilters>(() => {
    const filters: SearchFilters = {
      keyword: searchKeyword,
      onlyAbnormal,
      onlyPendingSupervisor,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined
    }
    if (activeFilter === 'pending_sync') {
      filters.syncStatus = 'pending'
    } else if (activeFilter === 'normal' || activeFilter === 'warning' || activeFilter === 'abnormal') {
      filters.tempStatus = activeFilter
    } else if (activeFilter === 'accepted' || activeFilter === 'partial_rejected' || activeFilter === 'pending_supervisor') {
      filters.conclusion = activeFilter
    }
    return filters
  }, [searchKeyword, activeFilter, onlyAbnormal, onlyPendingSupervisor, dateFrom, dateTo])

  const filteredRecords = useMemo(() => {
    return searchRecords(searchFilters)
  }, [records, searchRecords, searchFilters])

  const stats = useMemo(() => ({
    total: records.length,
    pending: records.filter(r => r.syncStatus === 'pending' || r.syncStatus === 'syncing' || r.syncStatus === 'failed').length,
    failed: records.filter(r => r.syncStatus === 'failed').length,
    abnormal: records.filter(r => r.overallStatus !== 'normal').length,
    pendingSupervisor: records.filter(r => r.conclusion === 'pending_supervisor').length
  }), [records])

  const handleRecordClick = (record: ReceiptRecord) => {
    Taro.navigateTo({
      url: `/pages/record-detail/index?id=${record.id}`
    })
  }

  const handleRetrySync = async (e: any, record: ReceiptRecord) => {
    e.stopPropagation()
    if (retryingId) return

    setRetryingId(record.id)
    try {
      await retrySync(record.id)
      Taro.showToast({ title: '已触发同步', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      setRetryingId(null)
    }
  }

  const handleRetryAll = async () => {
    if (stats.failed === 0) {
      Taro.showToast({ title: '没有需要重试的记录', icon: 'none' })
      return
    }
    try {
      await retryAllFailed()
      Taro.showToast({ title: '已开始批量同步', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleClearFilters = () => {
    setSearchKeyword('')
    setOnlyAbnormal(false)
    setOnlyPendingSupervisor(false)
    setActiveFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  const hasActiveFilters = onlyAbnormal || onlyPendingSupervisor || searchKeyword || dateFrom || dateTo

  const handleDateFromChange = (e) => {
    const val = e.detail.value
    setDateFrom(val)
  }

  const handleDateToChange = (e) => {
    const val = e.detail.value
    setDateTo(val)
  }

  const handleQuickDate = (days: number) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    setDateFrom(formatDate(from.toISOString()))
    setDateTo(formatDate(to.toISOString()))
  }

  const renderSyncBadge = (record: ReceiptRecord) => {
    const showRetry = record.syncStatus === 'failed' || record.syncStatus === 'pending'
    const hasHq = !!record.hqCallback
    const retryLabel = record.syncStatus === 'pending' ? '模拟回传' : '重试'

    return (
      <View className={styles.syncRow}>
        <Text
          className={styles.syncBadge}
          style={{
            background: `${getSyncStatusColor(record.syncStatus)}15`,
            color: getSyncStatusColor(record.syncStatus)
          }}>
          {record.syncStatus === 'syncing' ? '⏳ ' : record.syncStatus === 'failed' ? '❌ ' : ''}
          {getSyncStatusBizLabel(record.syncStatus, hasHq)}
        </Text>
        {showRetry && (
          <Text
            className={classnames(styles.retryBtn, {
              [styles.retrying]: retryingId === record.id
            })}
            onClick={(e) => handleRetrySync(e, record)}>
            {retryingId === record.id ? '同步中...' : retryLabel}
          </Text>
        )}
      </View>
    )
  }

  return (
    <ScrollView
      scrollY
      className={styles.container}
      enhanced
      showScrollbar={false}>
      <View className={styles.searchBar}>
        <View className={styles.searchInputWrap}>
          <Text className={styles.searchIcon}>🔍</Text>
          <input
            className={styles.searchInput}
            placeholder="搜索运单号、货品名、司机、日期..."
            value={searchKeyword}
            onInput={(e) => setSearchKeyword((e as any).detail.value)}
          />
          {searchKeyword && (
            <Text
              className={styles.searchClear}
              onClick={() => setSearchKeyword('')}>
              ✕
            </Text>
          )}
        </View>
        <Text
          className={classnames(styles.filterToggle, { [styles.active]: showFilters || hasActiveFilters })}
          onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? '收起' : '筛选'}
          {(onlyAbnormal || onlyPendingSupervisor || dateFrom || dateTo) && (
            <Text className={styles.filterDot}>●</Text>
          )}
        </Text>
      </View>

      {showFilters && (
        <View className={styles.filterPanel}>
          <View className={styles.filterGroup}>
            <Text className={styles.filterGroupTitle}>日期范围</Text>
            <View className={styles.dateRangeRow}>
              <Picker mode="date" onChange={handleDateFromChange} value={dateFrom || ''}>
                <View className={classnames(styles.dateInput, { [styles.dateSelected]: !!dateFrom })}>
                  <Text>{dateFrom || '开始日期'}</Text>
                </View>
              </Picker>
              <Text className={styles.dateSeparator}>至</Text>
              <Picker mode="date" onChange={handleDateToChange} value={dateTo || ''}>
                <View className={classnames(styles.dateInput, { [styles.dateSelected]: !!dateTo })}>
                  <Text>{dateTo || '结束日期'}</Text>
                </View>
              </Picker>
            </View>
            <View className={styles.quickDateRow}>
              <Text className={styles.quickDateBtn} onClick={() => handleQuickDate(7)}>近7天</Text>
              <Text className={styles.quickDateBtn} onClick={() => handleQuickDate(30)}>近30天</Text>
              <Text className={styles.quickDateBtn} onClick={() => handleQuickDate(90)}>近90天</Text>
              {(dateFrom || dateTo) && (
                <Text className={styles.quickDateClear} onClick={() => { setDateFrom(''); setDateTo('') }}>清除</Text>
              )}
            </View>
          </View>

          <View className={styles.filterGroup}>
            <Text className={styles.filterGroupTitle}>组合筛选</Text>
            <View className={styles.filterOptions}>
              <View
                className={classnames(styles.filterOption, { [styles.selected]: onlyAbnormal })}
                onClick={() => setOnlyAbnormal(!onlyAbnormal)}>
                <Text className={styles.optionCheck}>{onlyAbnormal ? '✓' : ''}</Text>
                <Text>只看异常温度</Text>
              </View>
              <View
                className={classnames(styles.filterOption, { [styles.selected]: onlyPendingSupervisor })}
                onClick={() => setOnlyPendingSupervisor(!onlyPendingSupervisor)}>
                <Text className={styles.optionCheck}>{onlyPendingSupervisor ? '✓' : ''}</Text>
                <Text>只看待主管确认</Text>
              </View>
            </View>
          </View>

          {hasActiveFilters && (
            <View className={styles.filterActions}>
              <Text className={styles.resetBtn} onClick={handleClearFilters}>
                重置筛选
              </Text>
            </View>
          )}
        </View>
      )}

      <View className={styles.statsBar}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{stats.total}</Text>
          <Text className={styles.statLabel}>总记录</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={styles.statValue} style={{ color: '#FF7D00' }}>
            {stats.pending}
          </Text>
          <Text className={styles.statLabel}>待回传</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={styles.statValue} style={{ color: '#F53F3F' }}>
            {stats.abnormal}
          </Text>
          <Text className={styles.statLabel}>温度异常</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem} onClick={() => Taro.navigateTo({ url: '/pages/stats/index' })}>
          <Text className={styles.statValue} style={{ color: '#165DFF' }}>
            📊
          </Text>
          <Text className={styles.statLabel}>复盘统计</Text>
        </View>
      </View>

      <ScrollView scrollX className={styles.filterBar}>
        {quickFilters.map(filter => (
          <View
            key={filter.key}
            className={classnames(styles.filterItem, {
              [styles.active]: activeFilter === filter.key
            })}
            onClick={() => setActiveFilter(filter.key)}>
            <Text>{filter.label}</Text>
          </View>
        ))}
      </ScrollView>

      {stats.failed > 0 && (
        <View className={styles.failedTip} onClick={handleRetryAll}>
          <Text className={styles.failedTipIcon}>⚠️</Text>
          <Text className={styles.failedTipText}>
            {stats.failed} 条记录回传失败，点击立即重试
          </Text>
          <Text className={styles.failedTipArrow}>→</Text>
        </View>
      )}

      {filteredRecords.length > 0 ? (
        filteredRecords.map(record => (
          <View
            key={record.id}
            className={styles.recordCard}
            onClick={() => handleRecordClick(record)}>
            <View className={styles.recordTop}>
              <Text className={styles.waybillNo}>{record.waybillNo}</Text>
              <TempStatusBadge status={record.overallStatus} />
            </View>

            <Text className={styles.productName}>{record.productName}</Text>

            <View className={styles.recordMeta}>
              <Text className={styles.metaItem}>
                📍 <Text className={styles.metaValue}>{record.warehouse}</Text>
              </Text>
              <Text className={styles.metaItem}>
                📦 <Text className={styles.metaValue}>
                  箱数差异：
                  <Text
                    className={classnames(styles.boxDiff, {
                      [styles.positive]: record.boxDiff > 0,
                      [styles.negative]: record.boxDiff < 0
                    })}>
                    {record.boxDiff > 0 ? '+' : ''}{record.boxDiff}
                  </Text>
                </Text>
              </Text>
            </View>

            <View className={styles.recordBottom}>
              <View className={styles.receiverInfo}>
                <Text className={styles.receiverName}>收货员：{record.receiverName}</Text>
              </View>
              <Text
                className={styles.conclusionTag}
                style={{
                  background: `${getConclusionColor(record.conclusion)}15`,
                  color: getConclusionColor(record.conclusion)
                }}>
                {getConclusionLabel(record.conclusion)}
              </Text>
            </View>

            {renderSyncBadge(record)}

            <View className={styles.timeRow}>
              <Text className={styles.timeText}>
                {formatDateTime(record.createdAt)}
              </Text>
              {record.photos.length > 0 && (
                <Text className={styles.photoCount}>📷 {record.photos.length}张</Text>
              )}
              {record.hqCallback && (
                <Text className={styles.hqBadge}>🏢 总部已确认</Text>
              )}
            </View>
          </View>
        ))
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyText}>暂无相关验收记录</Text>
          {hasActiveFilters && (
            <Text className={styles.emptySubText} onClick={handleClearFilters}>
              清除筛选条件
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  )
}

export default RecordsPage
