<template v-if="newNetworkUrl">
  <div class="issues-alert">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21.0907 18.7005C20.8457 19.1905 20.3449 19.5 19.7971 19.5H4.20288C3.65506 19.5 3.15426 19.1905 2.90927 18.7005C2.69455 18.2711 2.70694 17.7631 2.94232 17.3446L10.9455 3.11671C11.1598 2.73575 11.5629 2.5 12 2.5C12.4371 2.5 12.8402 2.73575 13.0545 3.11671L21.0577 17.3446C21.2931 17.7631 21.3054 18.2711 21.0907 18.7005Z"
        stroke="#FFC81A"
      />
      <circle cx="12" cy="16" r="1" fill="#FFC81A" />
      <path d="M12 14V6" stroke="#FFC81A" />
    </svg>
    <span>
      The network is under a heavy load at the moment and transaction indexing on the explorer is lagging behind.
      Transactions are being processed normally and will gradually show up. You can also use
      <a href="https://hyperscan.xyz/">hyperscan.xyz</a> meanwhile.
    </span>
  </div>
</template>

<style scoped lang="scss">
.issues-alert {
  @apply flex text-white rounded-2xl border border-amber-400/50 bg-amber-400/10 mb-6 py-3 px-4;

  svg {
    @apply mr-2 shrink-0;
  }

  a {
    @apply text-inherit;
  }
}
</style>
