import React from 'react'
import { Text } from 'react-native'
import { Tabs } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { SubjectProvider } from '../lib/SubjectContext'

export default function RootLayout() {
  return (
    <SubjectProvider>
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#4A90D9',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#eee',
            height: 60,
            paddingBottom: 8,
            paddingTop: 4
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600'
          }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Trang chủ',
            tabBarIcon: ({ color, size }) => (
              <TabIcon emoji="🏠" size={size} />
            )
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Bản đồ',
            tabBarIcon: ({ color, size }) => (
              <TabIcon emoji="🗺️" size={size} />
            )
          }}
        />
        <Tabs.Screen
          name="exam"
          options={{
            title: 'Thi thử',
            tabBarIcon: ({ color, size }) => (
              <TabIcon emoji="📝" size={size} />
            )
          }}
        />
        <Tabs.Screen
          name="practice"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="result"
          options={{
            href: null
          }}
        />
      </Tabs>
    </SafeAreaProvider>
    </SubjectProvider>
  )
}

function TabIcon({ emoji, size }: { emoji: string; size: number }) {
  return <Text style={{ fontSize: size - 4 }}>{emoji}</Text>
}
