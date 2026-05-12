<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useScopedI18n } from '@/i18n/app'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import {
    ContentCopyFilled,
    RefreshFilled,
    LogInFilled,
    DeleteFilled
} from '@vicons/material'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import { useIsMobile } from '../../utils/composables'
import { getRouterPathWithLang } from '../../utils'
import MailBox from '../../components/MailBox.vue'
import AddressSelect from '../../components/AddressSelect.vue'
import AddressCredentialModal from '../../components/AddressCredentialModal.vue'

const router = useRouter()
const { jwt, settings, useSimpleIndex, showAddressCredential, openSettings, loading, addressPassword, operatorMode } = useGlobalState()
const message = useMessage()
const dialog = useDialog()
const isMobile = useIsMobile()

const { t, locale } = useScopedI18n('views.index.SimpleIndex')

const mailBoxKey = ref("")
const showLoginModal = ref(false)
const loginName = ref('')
const loginLoading = ref(false)
const currentAutoRefreshInterval = ref(60)
const timer = ref(null)

const defaultDomain = computed(() => {
    if (openSettings.value.defaultDomains?.length) {
        return openSettings.value.defaultDomains[0]
    }
    if (openSettings.value.domains?.length) {
        return openSettings.value.domains[0].value
    }
    return 'faturismee.online'
})

const copyAddress = async () => {
    try {
        await navigator.clipboard.writeText(settings.value.address)
        message.success(t('addressCopied'))
    } catch (error) {
        message.error(t('copyFailed'))
    }
}

const refreshMails = () => {
    if (loading.value) return
    mailBoxKey.value = Date.now()
    currentAutoRefreshInterval.value = 60
    message.success(t('refreshSuccess'))
}

const accessOrCreateAddress = async () => {
    const name = loginName.value.trim()
    if (!name) {
        message.error(t('localPartPlaceholder'))
        return
    }
    loginLoading.value = true
    try {
        // Try creating the address first
        try {
            const res = await api.fetch("/api/new_address", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    domain: defaultDomain.value,
                    enablePrefix: false,
                })
            })
            jwt.value = res["jwt"]
            addressPassword.value = res["password"] || ''
            await api.getSettings()
            showLoginModal.value = false
            loginName.value = ''
            if (operatorMode.value) {
                showAddressCredential.value = true
            }
            message.success(t('loginSuccess'))
            return
        } catch (createError) {
            // If address already exists, try accessing it
            if (createError.message?.includes('already exists') || createError.message?.includes('已存在')) {
                const res = await api.fetch("/open_api/access_address", {
                    method: "POST",
                    body: JSON.stringify({
                        name,
                        domain: defaultDomain.value,
                    })
                })
                jwt.value = res["jwt"]
                await api.getSettings()
                showLoginModal.value = false
                loginName.value = ''
                if (operatorMode.value) {
                    showAddressCredential.value = true
                }
                message.success(t('loginSuccess'))
                return
            }
            throw createError
        }
    } catch (error) {
        message.error(error.message || t('loginFailed'))
    } finally {
        loginLoading.value = false
    }
}

const deleteAddress = () => {
    dialog.warning({
        title: t('deleteAddress'),
        content: t('confirmDeleteAddress'),
        positiveText: t('deleteAddress'),
        negativeText: 'Cancel',
        onPositiveClick: async () => {
            try {
                await api.fetch('/api/delete_address', { method: 'DELETE' })
                jwt.value = ''
                message.success(t('deleteAddressSuccess'))
                await router.push(getRouterPathWithLang("/", locale.value))
                location.reload()
            } catch (error) {
                message.error(t('deleteAddressFailed'))
            }
        }
    })
}

const fetchMailData = async (limit, offset) => {
    return await api.fetch(`/api/mails?limit=${limit}&offset=${offset}`)
}

const deleteMail = async (curMailId) => {
    await api.fetch(`/api/mails/${curMailId}`, { method: 'DELETE' })
}

onMounted(async () => {
    await api.getSettings()

    timer.value = setInterval(() => {
        if (--currentAutoRefreshInterval.value <= 0) {
            refreshMails()
        }
    }, 1000)
})

onBeforeUnmount(() => {
    clearInterval(timer.value)
})
</script>

<template>
    <div class="center">
        <div v-if="!settings.address">
            <n-card :bordered="false" embedded>
                <div style="text-align: center; margin-bottom: 16px;">
                    <n-text style="font-size: 20px; font-weight: 600;">{{ t('loginModalTitle') }}</n-text>
                </div>
                <n-input-group>
                    <n-input v-model:value="loginName" :placeholder="t('localPartPlaceholder')" size="large"
                        @keyup.enter="accessOrCreateAddress" style="flex: 1;" />
                    <n-input-group-label size="large" style="font-weight: 500;">@{{ defaultDomain }}</n-input-group-label>
                </n-input-group>
                <n-button type="success" strong block size="large" style="margin-top: 16px;"
                    :loading="loginLoading" @click="accessOrCreateAddress">
                    <template #icon>
                        <n-icon><LogInFilled /></n-icon>
                    </template>
                    {{ t('accessButton') }}
                </n-button>
            </n-card>
        </div>

        <div v-else>
            <n-card :bordered="false" embedded>
                <div class="address-display">
                    <AddressSelect :showCopy="false" size="small" />
                </div>
                <n-grid :cols="isMobile ? 2 : 4" :x-gap="12" :y-gap="12" style="margin-top: 16px;">
                    <n-gi>
                        <n-button @click="copyAddress" type="primary" strong block :size="isMobile ? 'medium' : 'large'">
                            <template #icon>
                                <n-icon><ContentCopyFilled /></n-icon>
                            </template>
                            {{ t('copyAddress') }}
                        </n-button>
                    </n-gi>
                    <n-gi>
                        <n-button @click="refreshMails" :loading="loading" type="info" strong block
                            :size="isMobile ? 'medium' : 'large'">
                            <template #icon>
                                <n-icon><RefreshFilled /></n-icon>
                            </template>
                            {{ t('refreshMails') }}
                        </n-button>
                    </n-gi>
                    <n-gi>
                        <n-button @click="showLoginModal = true" type="success" strong block
                            :size="isMobile ? 'medium' : 'large'">
                            <template #icon>
                                <n-icon><LogInFilled /></n-icon>
                            </template>
                            {{ t('loginBtn') }}
                        </n-button>
                    </n-gi>
                    <n-gi>
                        <n-button @click="deleteAddress" type="error" strong block
                            :size="isMobile ? 'medium' : 'large'">
                            <template #icon>
                                <n-icon><DeleteFilled /></n-icon>
                            </template>
                            {{ t('deleteAddress') }}
                        </n-button>
                    </n-gi>
                </n-grid>
                <div style="text-align: center; margin-top: 8px;">
                    <n-text depth="3" style="font-size: 12px;">
                        {{ t('refreshAfter', { msg: Math.max(0, currentAutoRefreshInterval) }) }}
                    </n-text>
                    <template v-if="operatorMode">
                        <n-divider vertical />
                        <n-button text type="info" size="tiny" @click="useSimpleIndex = false">
                            {{ t('exitFullMode') }}
                        </n-button>
                    </template>
                </div>
            </n-card>

            <n-card :bordered="false" embedded style="text-align: left; margin-top: 12px;">
                <MailBox :key="mailBoxKey" :showEMailTo="false" :showReply="openSettings.enableSendMail"
                    :showSaveS3="openSettings.isS3Enabled" :saveToS3="() => {}"
                    :enableUserDeleteEmail="openSettings.enableUserDeleteEmail"
                    :fetchMailData="fetchMailData" :deleteMail="deleteMail" :showFilterInput="true" />
            </n-card>
        </div>

        <AddressCredentialModal v-if="operatorMode" v-model:show="showAddressCredential" :address="settings.address" :jwt="jwt"
            :address-password="addressPassword" />

        <n-modal v-model:show="showLoginModal" preset="card"
            :title="t('loginModalTitle')" style="width: min(480px, calc(100vw - 32px));">
            <n-input-group>
                <n-input v-model:value="loginName" :placeholder="t('localPartPlaceholder')" size="large"
                    @keyup.enter="accessOrCreateAddress" style="flex: 1;" />
                <n-input-group-label size="large" style="font-weight: 500;">@{{ defaultDomain }}</n-input-group-label>
            </n-input-group>
            <n-button type="success" strong block size="large" style="margin-top: 16px;"
                :loading="loginLoading" @click="accessOrCreateAddress">
                <template #icon>
                    <n-icon><LogInFilled /></n-icon>
                </template>
                {{ t('accessButton') }}
            </n-button>
        </n-modal>
    </div>
</template>

<style scoped>
.center {
    max-width: 900px;
    margin: 0 auto;
}

.n-card {
    margin-top: 10px;
    width: 100%;
}

.address-display {
    text-align: center;
    font-size: 18px;
}
</style>
