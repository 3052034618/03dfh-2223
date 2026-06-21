import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'
import TempStatusBadge from '@/components/TempStatusBadge'
import type { TempNode } from '@/types/coldchain'
import { formatDateTime, formatDuration, formatTemp } from '@/utils/format'

interface TempNodeCardProps {
  node: TempNode
}

const TempNodeCard: React.FC<TempNodeCardProps> = ({ node }) => {
  const [expanded, setExpanded] = useState(false)

  const handleToggle = () => {
    setExpanded(!expanded)
  }

  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <Text className={styles.nodeTitle}>{node.label}</Text>
        <TempStatusBadge status={node.status} />
      </View>

      <View className={styles.metaRow}>
        <Text className={styles.metaLabel}>时间段</Text>
        <Text className={styles.metaValue}>
          {formatDateTime(node.startTime, 'HH:mm')} - {formatDateTime(node.endTime, 'HH:mm')}
        </Text>
      </View>

      <View className={styles.metaRow}>
        <Text className={styles.metaLabel}>平均温度</Text>
        <Text className={`${styles.metaValue} ${styles.tempHighlight}`}>
          {formatTemp(node.avgTemp)}
        </Text>
      </View>

      <View className={styles.metaRow}>
        <Text className={styles.metaLabel}>温度范围</Text>
        <Text className={styles.metaValue}>
          {formatTemp(node.tempRange[0])} ~ {formatTemp(node.tempRange[1])}
        </Text>
      </View>

      {node.abnormalCount > 0 && (
        <View className={styles.metaRow}>
          <Text className={styles.metaLabel}>异常次数</Text>
          <Text className={styles.metaValue} style={{ color: '#F53F3F' }}>
            {node.abnormalCount} 次
          </Text>
        </View>
      )}

      {node.abnormalCount > 0 && (
        <View className={styles.abnormalSection}>
          <Text className={styles.abnormalTitle}>
            异常片段详情
          </Text>

          {!expanded && node.abnormalSegments.slice(0, 1).map(seg => (
            <View key={seg.id} className={styles.abnormalItem}>
              <Text className={styles.abnormalTime}>
                {formatDateTime(seg.startTime, 'HH:mm')} - {formatDateTime(seg.endTime, 'HH:mm')}
              </Text>
              <Text className={styles.abnormalDuration}>
                持续 {formatDuration(seg.durationMinutes)}
              </Text>
              <Text className={styles.abnormalTemps}>
                最高 {formatTemp(seg.maxTemp)} / 最低 {formatTemp(seg.minTemp)} / 平均 {formatTemp(seg.avgTemp)}
              </Text>
              <Text className={styles.abnormalRemark}>
                承运方备注：{seg.carrierRemark}
              </Text>
            </View>
          ))}

          {expanded && node.abnormalSegments.map(seg => (
            <View key={seg.id} className={styles.abnormalItem}>
              <Text className={styles.abnormalTime}>
                {formatDateTime(seg.startTime, 'HH:mm')} - {formatDateTime(seg.endTime, 'HH:mm')}
              </Text>
              <Text className={styles.abnormalDuration}>
                持续 {formatDuration(seg.durationMinutes)}
              </Text>
              <Text className={styles.abnormalTemps}>
                最高 {formatTemp(seg.maxTemp)} / 最低 {formatTemp(seg.minTemp)} / 平均 {formatTemp(seg.avgTemp)}
              </Text>
              <Text className={styles.abnormalRemark}>
                承运方备注：{seg.carrierRemark}
              </Text>
            </View>
          ))}

          {node.abnormalSegments.length > 1 && (
            <View className={styles.expandBtn} onClick={handleToggle}>
              {expanded ? '收起' : `展开全部 ${node.abnormalSegments.length} 条异常`}
            </View>
          )}
        </View>
      )}

      {node.abnormalCount === 0 && (
        <View className={styles.emptyText}>
          本阶段温度正常，无异常记录
        </View>
      )}
    </View>
  )
}

export default TempNodeCard
