import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useReceiptStore } from '@/store/receipt'
import { formatDate, formatDateTime, getConclusionLabel, getHqDispositionLabel } from '@/utils/format'

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
    if (dateFrom || dateTo) {
      result = result.filter(r => {
        const ad = r.actualArrival.substring(0, 10)
        const sd = r.submittedAt.substring(0, 10)
        const arrivalInRange = (!dateFrom || ad >= dateFrom) && (!dateTo || ad <= dateTo)
        const submittedInRange = (!dateFrom || sd >= dateFrom) && (!dateTo || sd <= dateTo)
        return arrivalInRange || submittedInRange
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
      const date = r.submittedAt.substring(0, 10)
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
    const filter: Record<string, any> = {}
    if (type === 'abnormal') filter.tempStatus = 'abnormal'
    else if (type === 'warning') filter.tempStatus = 'warning'
    else if (type === 'partialRejected') filter.conclusion = 'partial_rejected'
    else if (type === 'pendingSupervisor') filter.conclusion = 'pending_supervisor'
    else if (type === 'syncFailed') filter.syncStatus = 'failed'
    if (dateFrom) filter.dateFrom = dateFrom
    if (dateTo) filter.dateTo = dateTo

    ;(Taro as any).__pendingRecordsFilter = filter
    Taro.switchTab({ url: '/pages/records/index' })
  }

  const handleDailyStatClick = (stat: DateStat, type: string) => {
    const filter: Record<string, any> = { dateFrom: stat.date, dateTo: stat.date }
    if (type === 'abnormal') filter.onlyAbnormal = true
    else if (type === 'partialRejected') filter.conclusion = 'partial_rejected'
    else if (type === 'pendingSupervisor') filter.conclusion = 'pending_supervisor'
    else if (type === 'syncFailed') filter.syncStatus = 'failed'

    ;(Taro as any).__pendingRecordsFilter = filter
    Taro.switchTab({ url: '/pages/records/index' })
  }

  const handleExport = () => {
    if (filteredRecords.length === 0) {
      Taro.showToast({ title: '暂无数据可导出', icon: 'none' })
      return
    }

    const range = dateFrom || dateTo
      ? `${dateFrom || '最早'} ~ ${dateTo || '最新'}`
      : '全部日期'

    const tempStatusMap: Record<string, string> = {
      normal: '达标', warning: '偏高', abnormal: '异常'
    }

    let lines: string[] = []
    lines.push('═══════════════════════════════════════')
    lines.push('        冷链验收月度复盘明细')
    lines.push('═══════════════════════════════════════')
    lines.push(`统计范围：${range}`)
    lines.push(`导出时间：${formatDateTime(new Date().toISOString())}`)
    lines.push('')
    lines.push('─── 汇总统计 ───')
    lines.push(`验收总数：${overallStats.total}`)
    lines.push(`温度达标：${overallStats.normal}  偏高：${overallStats.warning}  异常：${overallStats.abnormal}`)
    lines.push(`正常接收：${overallStats.accepted}  部分拒收：${overallStats.partialRejected}  待主管确认：${overallStats.pendingSupervisor}`)
    lines.push(`回传失败：${overallStats.syncFailed}  已回传：${overallStats.synced}`)
    if (overallStats.total > 0) {
      lines.push(`温度达标率：${((overallStats.normal / overallStats.total) * 100).toFixed(1)}%`)
      lines.push(`正常接收率：${((overallStats.accepted / overallStats.total) * 100).toFixed(1)}%`)
    }
    lines.push('')
    lines.push('─── 验收明细 ───')

    filteredRecords.forEach((r, i) => {
      lines.push(`[${i + 1}] ${r.waybillNo}`)
      lines.push(`    货品：${r.productName}（${r.productCount}${r.unit}）`)
      lines.push(`    到店：${formatDateTime(r.actualArrival)}  提交：${formatDateTime(r.submittedAt)}`)
      lines.push(`    温度：${tempStatusMap[r.overallStatus] || r.overallStatus}  结论：${getConclusionLabel(r.conclusion)}`)
      lines.push(`    箱数差异：${r.boxDiff > 0 ? '+' : ''}${r.boxDiff}`)
      if (r.hqCallback) {
        const disp = r.hqCallback.finalDisposition
          ? getHqDispositionLabel(r.hqCallback.finalDisposition)
          : '待处理'
        lines.push(`    总部：${disp}（${r.hqCallback.confirmNo}）`)
        if (r.hqCallback.finalDispositionNote) {
          lines.push(`    说明：${r.hqCallback.finalDispositionNote}`)
        }
      }
      lines.push('')
    })

    const content = lines.join('\n')

    if (process.env.TARO_ENV === 'h5') {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `冷链验收复盘_${range.replace(/\s/g, '')}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      Taro.showToast({ title: '导出成功', icon: 'success' })
    } else {
      Taro.setClipboardData({
        data: content,
        success: () => {
          Taro.showToast({ title: '已复制到剪贴板', icon: 'success' })
        }
      })
    }
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
        <View className={styles.cardTitleRow}>
          <Text className={styles.cardTitle}>
            <Text className={styles.titleIcon}>📊</Text>
            汇总统计
            {(dateFrom || dateTo) && (
              <Text className={styles.dateHint}>
                ({dateFrom || '最早'} ~ {dateTo || '最新'})
              </Text>
            )}
          </Text>
          <Text className={styles.exportBtn} onClick={handleExport}>📥 导出</Text>
        </View>

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
