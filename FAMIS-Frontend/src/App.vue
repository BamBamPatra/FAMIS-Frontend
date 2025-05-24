<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import ProfileBar from '@/components/ProfileBar.vue'
</script>

<template>
  <div id="layout">
    <!-- Vertical Navbar -->
    <div class="navbar">
      <RouterLink to="/" class="nav-item">HOME</RouterLink>
      <RouterLink to="/history" class="nav-item">HISTORY</RouterLink>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <div>
        <ProfileBar />
      </div>
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
#layout {
  display: flex;
  min-height: 100vh;
}

.navbar {
  width: 200px;
  padding: 16px;
  border-right: 1px solid #ccc;
  display: flex;
  flex-direction: column;
}

.nav-item {
  padding: 30px 0;
  border-bottom: 1px solid #ccc;
  text-decoration: none;
  color: #333;
  text-align: center;
}

.nav-item:last-child {
  border-bottom: none;
}

.nav-item:hover {
  background-color: #9B7EBD;
  color: white;
}

.main-content {
  flex: 1;
}
</style>