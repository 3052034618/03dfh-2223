import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useReceiptStore } from '@/store/receipt'
import { formatDate } from '@/utils/format'

interface DateStat {
  date: string
  total: number
  abnormal: number
  partialRejected: number
  pendingSupervisor: number
  syncFailed: number
}

const StatsPage: React.FC = () => {
  const records = useReceiptStore(state => state.records)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filteredRecords = useMemo(() => {
    let result = [...records]
    if (dateFrom) {
      result = result.filter(r => {
        const d = r.createdAt.substring(0, 10)
        return d >= dateFrom
      })
    }
    if (dateTo) {
      result = result.filter(r => {
        const d = r.createdAt.substring(0, 10)
        return d <= dateTo
      })
    }
    return result
  }, [records, dateFrom, dateTo])

  const overallStats = useMemo(() => ({
    total: filteredRecords.length,
    normal: filteredRecords.filter(r => r.overallStatus === 'normal').length,
    warning: filteredRecords.filter(r => r.overallStatus === 'warning').length,
    abnormal: filteredRecords.filter(r => r.overallStatus === 'abnormal').length,
    accepted: filteredRecords.filter(r => r.conclusion === 'accepted').length,
    partialRejected: filteredRecords.filter(r => r.conclusion === 'partial_rejected').length,
    pendingSupervisor: filteredRecords.filter(r => r.conclusion === 'pending_supervisor').length,
    syncFailed: filteredRecords.filter(r => r.syncStatus === 'failed').length,
    synced: filteredRecords.filter(r => r.syncStatus === 'synced').length
  }), [filteredRecords])

  const dailyStats = useMemo(() => {
    const map = new Map<string, DateStat>()
    filteredRecords.forEach(r => {
      const date = r.createdAt.substring(0, 10)
      const stat = map.get(date) || {
        date,
        total: 0,
        abnormal: 0,
        partialRejected: 0,
        pendingSupervisor: 0,
        syncFailed: 0
      }
      stat.total++
      if (r.overallStatus !== 'normal') stat.abnormal++
      if (r.conclusion === 'partial_rejected') stat.partialRejected++
      if (r.conclusion === 'pending_supervisor') stat.pendingSupervisor++
      if (r.syncStatus === 'failed') stat.syncFailed++
      map.set(date, stat)
    })
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date))
  }, [filteredRecords])

  const handleQuickDate = (days: number) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    setDateFrom(formatDate(from.toISOString()))
    setDateTo(formatDate(to.toISOString()))
  }

  const handleClearDate = () => {
    setDateFrom('')
    setDateTo('')
  }

  const handleStatClick = (type: string) => {
    let filterParam = ''
    if (type === 'abnormal') filterParam = '&tempStatus=abnormal'
    else if (type === 'warning') filterParam = '&tempStatus=warning'
    else if (type === 'partialRejected') filterParam = '&conclusion=partial_rejected'
    else if (type === 'pendingSupervisor') filterParam = '&conclusion=pending_supervisor'
    else if (type === 'syncFailed') filterParam = '&syncStatus=failed'

    Taro.navigateTo({
      url: `/pages/records/index?fromStats=1${filterParam}${dateFrom ? '&dateFrom=' + dateFrom : ''}${dateTo ? '&dateTo=' + dateTo : ''}`
    })
  }

  const handleDailyStatClick = (stat: DateStat, type: string) => {
    let filterParam = ''
    if (type === 'abnormal') filterParam = '&onlyAbnormal=1'
    else if (type === 'partialRejected') filterParam = '&conclusion=partial_rejected'
    else if (type === 'pendingSupervisor') filterParam = '&conclusion=pending_supervisor'
    else if (type === 'syncFailed') filterParam = '&syncStatus=failed'

    Taro.navigateTo({
      url: `/pages/records/index?fromStats=1&dateFrom=${stat.date}&dateTo=${stat.date}${filterParam}`
    })
  }

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.dateFilter}>
        <View className={styles.dateFilterTitle}>
          <Text className={styles.sectionIcon}>📅</Text>
          <Text className={styles.sectionTitle}>统计范围</Text>
        </View>
        <View className={styles.dateRangeRow}>
          <Picker mode="date" onChange={(e) => setDateFrom(e.detail.value)} value={dateFrom || ''}>
            <View className={classnames(styles.dateInput, { [styles.dateSelected]: !!dateFrom })}>
              <Text>{dateFrom || '开始日期'}</Text>
            </View>
          </Picker>
          <Text className={styles.dateSeparator}>至</Text>
          <Picker mode="date" onChange={(e) => setDateTo(e.detail.value)} value={dateTo || ''}>
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
            <Text className={styles.quickDateClear} onClick={handleClearDate}>全部日期</Text>
          )}
        </View>
      </View>

      <View className={styles.overviewCard}>
        <Text className={styles.cardTitle}>
          <Text className={styles.titleIcon}>📊</Text>
          汇总统计
          {(dateFrom || dateTo) && (
            <Text className={styles.dateHint}>
              ({dateFrom || '最早'} ~ {dateTo || '最新'})
            </Text>
          )}
        </Text>

        <View className={styles.overviewGrid}>
          <View className={styles.overviewItem} onClick={() => handleStatClick('total')}>
            <Text className={styles.overviewValue}>{overallStats.total}</Text>
            <Text className={styles.overviewLabel}>验收总数</Text>
          </View>
          <View className={styles.overviewItem} onClick={() => handleStatClick('abnormal')}>
            <Text className={styles.overviewValue} style={{ color: '#F53F3F' }}>
              {overallStats.abnormal}
            </Text>
            <Text className={styles.overviewLabel}>温度异常</Text>
          </View>
          <View className={styles.overviewItem} onClick={() => handleStatClick('partialRejected')}>
            <Text className={styles.overviewValue} style={{ color: '#FF7D00' }}>
              {overallStats.partialRejected}
            </Text>
            <Text className={styles.overviewLabel}>部分拒收</Text>
          </View>
          <View className={styles.overviewItem} onClick={() => handleStatClick('pendingSupervisor')}>
            <Text className={styles.overviewValue} style={{ color: '#165DFF' }}>
              {overallStats.pendingSupervisor}
            </Text>
            <Text className={styles.overviewLabel}>待主管确认</Text>
          </View>
          <View className={styles.overviewItem} onClick={() => handleStatClick('syncFailed')}>
            <Text className={styles.overviewValue} style={{ color: '#F53F3F' }}>
              {overallStats.syncFailed}
            </Text>
            <Text className={styles.overviewLabel}>回传失败</Text>
          </View>
          <View className={styles.overviewItem} onClick={() => handleStatClick('synced')}>
            <Text className={styles.overviewValue} style={{ color: '#00B42A' }}>
              {overallStats.synced}
            </Text>
            <Text className={styles.overviewLabel}>已回传</Text>
          </View>
        </View>

        {overallStats.total > 0 && (
          <View className={styles.ratioRow}>
            <View className={styles.ratioItem}>
              <Text className={styles.ratioLabel}>温度达标率</Text>
              <Text className={styles.ratioValue} style={{ color: '#00B42A' }}>
                {((overallStats.normal / overallStats.total) * 100).toFixed(1)}%
              </Text>
            </View>
            <View className={styles.ratioItem}>
              <Text className={styles.ratioLabel}>正常接收率</Text>
              <Text className={styles.ratioValue} style={{ color: '#00B42A' }}>
                {((overallStats.accepted / overallStats.total) * 100).toFixed(1)}%
              </Text>
            </View>
            <View className={styles.ratioItem}>
              <Text className={styles.ratioLabel}>回传成功率</Text>
              <Text className={styles.ratioValue} style={{ color: '#165DFF' }}>
                {((overallStats.synced / overallStats.total) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        )}
      </View>

      <View className={styles.dailyCard}>
        <Text className={styles.cardTitle}>
          <Text className={styles.titleIcon}>📈</Text>
          按日汇总
        </Text>

        {dailyStats.length > 0 ? (
          <View className={styles.dailyList}>
            {dailyStats.map(stat => (
              <View key={stat.date} className={styles.dailyItem}>
                <View className={styles.dailyDate}>
                  <Text className={styles.dailyDateText}>{stat.date}</Text>
                  <Text className={styles.dailyTotal}>{stat.total} 单</Text>
                </View>
                <View className={styles.dailyStats}>
                  {stat.abnormal > 0 && (
                    <Text
                      className={styles.dailyTag}
                      style={{ background: 'rgba(245,63,63,0.1)', color: '#F53F3F' }}
                      onClick={() => handleDailyStatClick(stat, 'abnormal')}>
                      异常 {stat.abnormal}
                    </Text>
                  )}
                  {stat.partialRejected > 0 && (
                    <Text
                      className={styles.dailyTag}
                      style={{ background: 'rgba(255,125,0,0.1)', color: '#FF7D00' }}
                      onClick={() => handleDailyStatClick(stat, 'partialRejected')}>
                      拒收 {stat.partialRejected}
                    </Text>
                  )}
                  {stat.pendingSupervisor > 0 && (
                    <Text
                      className={styles.dailyTag}
                      style={{ background: 'rgba(22,93,255,0.1)', color: '#165DFF' }}
                      onClick={() => handleDailyStatClick(stat, 'pendingSupervisor')}>
                      待主管 {stat.pendingSupervisor}
                    </Text>
                  )}
                  {stat.syncFailed > 0 && (
                    <Text
                      className={styles.dailyTag}
                      style={{ background: 'rgba(245,63,63,0.1)', color: '#F53F3F' }}
                      onClick={() => handleDailyStatClick(stat, 'syncFailed')}>
                      失败 {stat.syncFailed}
                    </Text>
                  )}
                  {stat.abnormal === 0 && stat.partialRejected === 0 && stat.pendingSupervisor === 0 && stat.syncFailed === 0 && (
                    <Text className={styles.dailyTag} style={{ background: 'rgba(0,180,42,0.1)', color: '#00B42A' }}>
                      全部正常
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📊</Text>
            <Text className={styles.emptyText}>暂无统计数据</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

export default StatsPage
