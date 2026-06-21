import React, { useEffect, useState } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import TempStatusBadge from '@/components/TempStatusBadge'
import { mockUser } from '@/data/mockData'
import {
  formatDateTime,
  getConclusionLabel,
  getConclusionColor,
  getSyncStatusLabel,
  getSyncStatusColor
} from '@/utils/format'
import { useReceiptStore } from '@/store/receipt'
import type { ReceiptRecord } from '@/types/coldchain'

const HomePage: React.FC = () => {
  const scanWaybill = useReceiptStore(state => state.scanWaybill)
  const isScanning = useReceiptStore(state => state.isScanning)
  const scanError = useReceiptStore(state => state.scanError)
  const records = useReceiptStore(state => state.records)
  const reset = useReceiptStore(state => state.reset)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualWaybillNo, setManualWaybillNo] = useState('')
  const queryWaybill = useReceiptStore(state => state.queryWaybill)

  useEffect(() => {
    if (scanError) {
      Taro.showToast({
        title: scanError,
        icon: 'none',
        duration: 3000
      })
    }
  }, [scanError])

  const todayRecords = records.filter(r => r.createdAt.startsWith('2024-06-15'))
  const recentRecords = records.slice(0, 3)
  const pendingCount = records.filter(r => r.syncStatus !== 'synced').length

  const handleScan = async () => {
    reset()
    const waybill = await scanWaybill()

    if (waybill) {
      Taro.navigateTo({
        url: '/pages/waybill/index'
      })
    }
  }

  const handleManualQuery = () => {
    if (!manualWaybillNo.trim()) {
      Taro.showToast({ title: '请输入运单号', icon: 'none' })
      return
    }
    reset()
    const waybill = queryWaybill(manualWaybillNo.trim())
    if (waybill) {
      setShowManualInput(false)
      setManualWaybillNo('')
      Taro.navigateTo({
        url: '/pages/waybill/index'
      })
    } else {
      Taro.showToast({
        title: `未找到运单「${manualWaybillNo.trim()}」`,
        icon: 'none',
        duration: 3000
      })
    }
  }

  const handleRecordClick = (record: ReceiptRecord) => {
    Taro.navigateTo({
      url: `/pages/record-detail/index?id=${record.id}`
    })
  }

  const handleViewAllRecords = () => {
    Taro.switchTab({
      url: '/pages/records/index'
    })
  }

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.hero}>
        <View className={styles.heroTop}>
          <View className={styles.storeInfo}>
            <Text className={styles.storeName}>{mockUser.storeName}</Text>
            <Text className={styles.userName}>
              {mockUser.role} · {mockUser.name}
            </Text>
          </View>
          <Image className={styles.avatar} src={mockUser.avatar} mode="aspectFill" />
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{todayRecords.length}</Text>
            <Text className={styles.statLabel}>今日验收</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>
              {todayRecords.filter(r => r.overallStatus === 'normal').length}
            </Text>
            <Text className={styles.statLabel}>温度达标</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>
              {todayRecords.filter(r => r.overallStatus !== 'normal').length}
            </Text>
            <Text className={styles.statLabel}>需关注</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue} style={{ color: '#FF7D00' }}>
              {pendingCount}
            </Text>
            <Text className={styles.statLabel}>待回传</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.scanCard}>
          <View className={styles.scanHeader}>
            <Text className={styles.scanTitle}>开始验收</Text>
            <Text className={styles.scanSubtitle}>
              扫描司机出示的运单二维码，快速核验冷链温度
            </Text>
          </View>

          <View
            className={`${styles.scanBtn} ${isScanning ? styles.scanBtnDisabled : ''}`}
            onClick={!isScanning ? handleScan : undefined}>
            <Text className={styles.scanIcon}>{isScanning ? '⏳' : '📷'}</Text>
            <Text className={styles.scanBtnText}>
              {isScanning ? '扫码中...' : '扫一扫运单码'}
            </Text>
          </View>

          {!showManualInput && (
            <Text
              className={styles.manualInputBtn}
              onClick={() => setShowManualInput(true)}>
              手动输入运单号 →
            </Text>
          )}

          {showManualInput && (
            <View className={styles.manualInputWrap}>
              <View className={styles.manualInputRow}>
                <input
                  className={styles.manualInput}
                  placeholder="请输入运单号，如 CC-20240615-00892"
                  value={manualWaybillNo}
                  onInput={(e) => setManualWaybillNo((e as any).detail.value)}
                />
                <View className={styles.queryBtn} onClick={handleManualQuery}>
                  <Text className={styles.queryBtnText}>查询</Text>
                </View>
              </View>
              <Text
                className={styles.cancelManualBtn}
                onClick={() => {
                  setShowManualInput(false)
                  setManualWaybillNo('')
                }}>
                取消
              </Text>
            </View>
          )}

          <Text className={styles.quickTip}>
            扫码后将依次查看运单信息 → 温度记录 → 确认收货
          </Text>

          <View className={styles.sampleCodes}>
            <Text className={styles.sampleTitle}>测试运单号：</Text>
            <View className={styles.sampleTags}>
              <Text
                className={styles.sampleTag}
                onClick={() => {
                  setManualWaybillNo('CC-20240615-00892')
                  setShowManualInput(true)
                }}>
                CC-20240615-00892（冻猪排骨，橙色警告）
              </Text>
              <Text
                className={styles.sampleTag}
                onClick={() => {
                  setManualWaybillNo('CC-20240615-00956')
                  setShowManualInput(true)
                }}>
                CC-20240615-00956（冷鲜牛肉，绿色正常）
              </Text>
              <Text
                className={styles.sampleTag}
                onClick={() => {
                  setManualWaybillNo('CC-20240615-01023')
                  setShowManualInput(true)
                }}>
                CC-20240615-01023（冻虾仁，红色异常）
              </Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>最近验收记录</Text>
            <Text className={styles.sectionMore} onClick={handleViewAllRecords}>
              查看全部 →
            </Text>
          </View>

          {recentRecords.length > 0 ? (
            recentRecords.map(record => (
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
                  <Text className={styles.metaItem}>📍 {record.warehouse}</Text>
                  <Text
                    className={styles.metaItem}
                    style={{
                      color: getSyncStatusColor(record.syncStatus)
                    }}>
                    ● {getSyncStatusLabel(record.syncStatus)}
                  </Text>
                </View>

                <View className={styles.recordBottom}>
                  <Text className={styles.timeText}>
                    {formatDateTime(record.createdAt)}
                  </Text>
                  <Text
                    className={styles.conclusionTag}
                    style={{
                      background: `${getConclusionColor(record.conclusion)}15`,
                      color: getConclusionColor(record.conclusion)
                    }}>
                    {getConclusionLabel(record.conclusion)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📋</Text>
              <Text className={styles.emptyText}>暂无验收记录</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

export default HomePage
