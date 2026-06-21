import React from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { mockUser, mockReceiptRecords } from '@/data/mockData'

const MinePage: React.FC = () => {
  const totalRecords = mockReceiptRecords.filter(r => r.receiverName === mockUser.name).length
  const normalRecords = mockReceiptRecords.filter(
    r => r.receiverName === mockUser.name && r.overallStatus === 'normal'
  ).length
  const abnormalRecords = totalRecords - normalRecords

  const handleMenuItemClick = (title: string) => {
    Taro.showToast({
      title: `${title}功能开发中`,
      icon: 'none'
    })
  }

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.header}>
        <View className={styles.userCard}>
          <Image className={styles.avatar} src={mockUser.avatar} mode="aspectFill" />
          <View className={styles.userInfo}>
            <Text className={styles.userName}>{mockUser.name}</Text>
            <Text className={styles.userRole}>{mockUser.role}</Text>
            <Text className={styles.userPhone}>{mockUser.phone}</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.storeCard}>
          <Text className={styles.storeLabel}>所属门店</Text>
          <Text className={styles.storeName}>{mockUser.storeName}</Text>
          <Text className={styles.storeAddress}>{mockUser.storeAddress}</Text>
        </View>

        <View className={styles.statsCard}>
          <Text className={styles.statsTitle}>我的验收统计</Text>
          <View className={styles.statsGrid}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{totalRecords}</Text>
              <Text className={styles.statLabel}>累计验收</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#00B42A' }}>
                {normalRecords}
              </Text>
              <Text className={styles.statLabel}>温度达标</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#F53F3F' }}>
                {abnormalRecords}
              </Text>
              <Text className={styles.statLabel}>需关注</Text>
            </View>
          </View>
        </View>

        <View className={styles.menuCard}>
          <View
            className={styles.menuItem}
            onClick={() => Taro.navigateTo({ url: '/pages/stats/index' })}>
            <View className={styles.menuLeft}>
              <Text className={styles.menuIcon}>📊</Text>
              <Text className={styles.menuText}>复盘统计</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View
            className={styles.menuItem}
            onClick={() => Taro.navigateTo({ url: '/pages/reconciliation/index' })}>
            <View className={styles.menuLeft}>
              <Text className={styles.menuIcon}>🏢</Text>
              <Text className={styles.menuText}>总部对账</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View
            className={styles.menuItem}
            onClick={() => handleMenuItemClick('操作指南')}>
            <View className={styles.menuLeft}>
              <Text className={styles.menuIcon}>📖</Text>
              <Text className={styles.menuText}>操作指南</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View
            className={styles.menuItem}
            onClick={() => handleMenuItemClick('常见问题')}>
            <View className={styles.menuLeft}>
              <Text className={styles.menuIcon}>❓</Text>
              <Text className={styles.menuText}>常见问题</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View
            className={styles.menuItem}
            onClick={() => handleMenuItemClick('联系总部')}>
            <View className={styles.menuLeft}>
              <Text className={styles.menuIcon}>📞</Text>
              <Text className={styles.menuText}>联系总部</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View
            className={styles.menuItem}
            onClick={() => handleMenuItemClick('设置')}>
            <View className={styles.menuLeft}>
              <Text className={styles.menuIcon}>⚙️</Text>
              <Text className={styles.menuText}>设置</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

export default MinePage
