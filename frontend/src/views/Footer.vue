<script setup>
import { useScopedI18n } from '@/i18n/app'
import { useGlobalState } from '../store'
import { Whatsapp } from '@vicons/fa'

const { openSettings } = useGlobalState()

const { t } = useScopedI18n('views.Footer')

</script>

<template>
    <div>
        <n-divider class="footer-divider" />
        <div style="text-align: center; padding: 20px">
            <div style="margin-bottom: 8px;">
                <n-text depth="3">
                    <a href="https://wa.me/6285877961552" target="_blank" rel="noopener noreferrer"
                        style="text-decoration: none; color: inherit; display: inline-flex; align-items: center; gap: 6px;">
                        <n-icon size="18" color="#25D366"><Whatsapp /></n-icon>
                        Hubungi Admin 085877961552
                    </a>
                </n-text>
            </div>
            <n-text depth="3">
                © {{ new Date().getFullYear() }} Mirai Tech Store | faturismee.online
            </n-text>
        </div>
    </div>
</template>


<style scoped>
.footer-divider {
    margin: 0;
    padding: 0 var(--x-padding);
}
</style>
