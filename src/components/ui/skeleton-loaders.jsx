import React from 'react';
import { motion } from 'framer-motion';

// Skeleton de base
export function Skeleton({ className = '', ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 rounded ${className}`}
      {...props}
    />
  );
}

// Skeleton pour les cartes de rendez-vous
export function AppointmentCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm mb-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton pour les cartes de professionnels
export function ProfessionalCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm mb-4">
      <div className="relative">
        <Skeleton className="h-32 w-full" />
        <div className="absolute -bottom-8 left-4">
          <Skeleton className="w-20 h-20 rounded-full border-4 border-white" />
        </div>
      </div>
      <div className="pt-10 p-4 space-y-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg mt-4" />
      </div>
    </div>
  );
}

// Skeleton pour les messages
export function MessageSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 border-b dark:border-gray-800 animate-pulse">
      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-start">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

// Skeleton pour les patients
export function PatientCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm mb-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  );
}

// Skeleton pour les statistiques
export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

// Skeleton pour les posts communauté
export function CommunityPostSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm mb-4">
      <div className="flex items-start gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

// Skeleton pour le profil enfant
export function ChildProfileSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm mb-4">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    </div>
  );
}

// Skeleton pour liste générique
export function ListSkeleton({ count = 5, renderItem = AppointmentCardSkeleton }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => 
        React.createElement(renderItem, { key: i })
      )}
    </div>
  );
}

// Skeleton pour grille de cartes
export function GridSkeleton({ count = 6, columns = 2 }) {
  return (
    <div className={`grid grid-cols-${columns} gap-4`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
          <Skeleton className="w-12 h-12 rounded-lg mb-3 mx-auto" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-8 w-2/3 mx-auto" />
        </div>
      ))}
    </div>
  );
}

// Skeleton pour header de page
export function PageHeaderSkeleton() {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 border-b dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-20 rounded-xl" />
      </div>
    </div>
  );
}

// Skeleton pour Dashboard
export function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-6 w-32 mb-3" />
        <AppointmentCardSkeleton />
        <AppointmentCardSkeleton />
        <AppointmentCardSkeleton />
      </div>
    </div>
  );
}

export default {
  Skeleton,
  AppointmentCardSkeleton,
  ProfessionalCardSkeleton,
  MessageSkeleton,
  PatientCardSkeleton,
  StatCardSkeleton,
  CommunityPostSkeleton,
  ChildProfileSkeleton,
  ListSkeleton,
  GridSkeleton,
  PageHeaderSkeleton,
  DashboardSkeleton
};