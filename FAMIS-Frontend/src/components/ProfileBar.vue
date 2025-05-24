<script setup lang="ts">

</script>

<template>
  <div>
    <!-- Profile Bar -->
    <div class="profile-bar">
      <div class="user-info">
        <div class="email">ABC@cmu.ac.th</div>
        <div class="department">Collage of art, media and technology</div>
      </div>
      <div class="profile-circle"></div>
    </div>
  </div>
</template>

<style scoped>

.profile-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background-color: white;
  padding: 16px;
}

.user-info {
  text-align: right;
  margin-right: 16px;
}

.email {
  font-weight: bold;
  font-size: 18px;
  color: #000;
}

.department {
  font-size: 13px;
  color: #555;
}

.profile-circle {
  width: 80px;
  height: 80px;
  background-color: #d9d9d9;
  border-radius: 50%;
}
</style>