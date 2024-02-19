<template>
    <Popup :opened="opened">
        <OnClickOutside @trigger="closeAskPopup">
            <div class="ask-popup">
                <div class="ask-popup-header">
                    <h3 class="ask-popup-title">
                        {{ t("GoOutsidePageDialog.title") }}
                    </h3>

                    <button @click="closeAskPopup" class="ask-popup-close">
                        <XIcon />
                    </button>
                </div>
                <div class="ask-popup-content">
                    <p>{{ t('GoOutsidePageDialog.subtitle') }}</p>

                </div>
                <div class="ask-popup-footer">
                    <div class="mt-4">
                        <button
                          @click="goOutSideLink"
                          type="button"
                          class="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        >
                            {{ t("GoOutsidePageDialog.accessNow") }}
                        </button>
                  </div>
                </div>

            </div>
        </OnClickOutside>
    </Popup>
</template>

<script setup lang="ts">
import Popup from "@/components/common/Popup.vue";
import { useRouter } from "vue-router";
import { OnClickOutside } from "@vueuse/components";
import { XIcon } from "@heroicons/vue/outline";
import { useI18n } from "vue-i18n";
const router = useRouter();



const { t } = useI18n();
const props = defineProps({
    opened: {
        type: Boolean,
        default: false,
    },
    outsideLink:{
        type: String,
        default: '',

    }
});
const emit = defineEmits<{
    (eventName: "close"): void;
}>();


const closeAskPopup = () => {  
   emit('close')
};

const goOutSideLink=()=>{
    console.log(props.outsideLink);
    window.open(props.outsideLink, '_blank');
    emit('close')
  

}
</script>

<style lang="scss">
.ask-popup {
    @apply mx-auto rounded-lg bg-white p-6;
    border-radius: 20px;
}

.ask-popup-header {
    @apply mb-4 flex items-center justify-between;
}

.ask-popup-close {
    @apply rounded-md bg-neutral-200 p-1.5 focus:outline-none;

    svg {
        @apply h-6 w-6;
    }

    &:hover {
        @apply text-black;
    }
}

.ask-popup-title {
    @apply text-xl font-normal text-neutral-600;
}

.ask-popup-content {
    max-width: 500px;
}
.ask-popup-footer {
    .btn-link{
        text-decoration: none

    }
}


.ask-popup-button {
    @apply mb-2 rounded-md bg-neutral-200 text-sm text-neutral-600;

    &::after {
        @apply absolute left-5 top-full h-2 w-[2px] bg-neutral-200 content-[''];
    }

    &.status-active {
        @apply text-success-600;

        &::after {
            @apply bg-success-600;
        }
    }

    &.status-current {
        @apply p-2 text-neutral-600;
    }

    &.status-next {
        @apply p-2 pl-9 text-neutral-500;
    }

    &:last-child {
        @apply mb-0;

        &::after {
            @apply content-none;
        }
    }

    .ask-link {
        @apply p-2 text-inherit;

        &:hover {
            @apply text-inherit;

            .ask-link-icon {
                @apply text-black;
            }
        }
    }

    .ask-link-icon {
        @apply mr-0 text-neutral-600;
    }

    svg,
    .spinner-icon {
        @apply mr-2 h-5 w-5;
    }
}</style>