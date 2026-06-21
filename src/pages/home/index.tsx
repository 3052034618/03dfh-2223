import React from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import TempStatusBadge from '@/components/TempStatusBadge'
import { mockUser, mockReceiptRecords, mockWaybill, mockTempNodes } from '@/data/mockData'
import { formatDateTime, getConclusionLabel, getConclusionColor } from '@/utils/format'
import { useReceiptStore } from '@/store/receipt'
import type { ReceiptRecord } from '@/types/coldchain'

const HomePage: React.FC = () => {
  const setWaybillInfo = useReceiptStore(state => state.setWaybillInfo)
  const setTempNodes = useReceiptStore(state => state.setTempNodes)
  const calculateOverallStatus = useReceiptStore(state => state.calculateOverallStatus)
  const reset = useReceiptStore(state => state.reset)

  const todayRecords = mockReceiptRecords.filter(r => r.createdAt.startsWith('2024-06-15'))
  const recentRecords = mockReceiptRecords.slice(0, 3)

  const handleScan = async () => {
    try {
      reset()

      const res = await Taro.scanCode({
        onlyFromCamera: false,
        scanType: ['qrCode', 'barCode']
      })
      console.log('[HomePage] 扫码结果:', res.result)

      setWaybillInfo(mockWaybill)
      setTempNodes(mockTempNodes)
      calculateOverallStatus()

      Taro.navigateTo({
        url: '/pages/waybill/index'
      })
    } catch (error) {
      console.error('[HomePage] 扫码失败', error)

      setWaybillInfo(mockWaybill)
      setTempNodes(mockTempNodes)
      calculateOverallStatus()

      Taro.navigateTo({
        url: '/pages/waybill/index'
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

          <View className={styles.scanBtn} onClick={handleScan}>
            <Text className={styles.scanIcon}>📷</Text>
            <Text className={styles.scanBtnText}>扫一扫运单码</Text>
          </View>

          <Text className={styles.quickTip}>
            扫码后将依次查看运单信息 → 温度记录 → 确认收货
          </Text>
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
