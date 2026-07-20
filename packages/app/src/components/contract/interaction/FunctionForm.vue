<template>
  <form class="function-form" @submit.prevent="submit">
    <div v-for="(input, index) in inputs" class="disclosure-panel-input-container" :key="input.key + index">
      <FunctionArrayParameter
        v-if="input.isArray"
        v-model="form[input.key]"
        :label="input.label"
        :type="input.type"
        :disabled="disabled"
        :errors="errors[input.key]"
      />
      <div v-else class="function-parameter">
        <label :for="input.key" class="function-input-label">{{ input.label }}</label>
        <Input
          v-model="form[input.key]"
          type="text"
          :id="input.key"
          :disabled="disabled"
          :placeholder="input.placeholder"
          :error="errors[input.key]"
        />
      </div>
    </div>
    <slot />
  </form>
</template>

<script lang="ts" setup>
import { computed, type PropType, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useVuelidate } from "@vuelidate/core";
import { createI18nMessage, helpers, required } from "@vuelidate/validators";
import { parseEther } from "ethers";

import Input from "@/components/common/Input.vue";
import FunctionArrayParameter from "@/components/contract/interaction/FunctionArrayParameter.vue";

import { PAYABLE_AMOUNT_PARAM_NAME } from "@/composables/useContractInteraction";

import type { AbiFragment } from "@/composables/useAddress";

import { getRawFunctionType, getRequiredArrayLength, isArrayFunctionType } from "@/utils/helpers";
import { validateAbiValue } from "@/utils/validators";

const props = defineProps({
  type: {
    type: String as PropType<"read" | "write">,
    default: "read",
  },
  abiFragment: {
    type: Object as PropType<AbiFragment>,
    default: () => ({}),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["submit"]);

const { t } = useI18n();
const withI18nMessage = createI18nMessage({ t });
const form = ref<Record<string, string | string[]>>({});

const inputs = computed(() => {
  let inputsArray = props.abiFragment.inputs.map((e, index) =>
    isArrayFunctionType(e.type)
      ? {
          isArray: true,
          type: e.type,
          key: e.name,
          label: e.name,
        }
      : {
          key: e.name || `input${index}`,
          type: e.type,
          label: `${e.name} (${e.type})`,
          placeholder: `${e.name} (${e.type})`,
        }
  );
  if (props.abiFragment.stateMutability === "payable") {
    inputsArray.unshift({
      key: PAYABLE_AMOUNT_PARAM_NAME,
      type: "ether",
      label: "payableAmount (ether)",
      placeholder: "payableAmount (ether)",
    });
  }
  return inputsArray;
});

const v$ = useVuelidate(
  computed(() =>
    Object.fromEntries(
      inputs.value.map((input) => {
        if (input.isArray) {
          return [
            input.key,
            {
              $each: helpers.forEach({
                value: {
                  required: withI18nMessage(
                    (value: string, field: { value: string }, formValues: Record<string, { value: string }[]>) => {
                      if (value) {
                        return true;
                      } else if (
                        !getRequiredArrayLength(input.type) &&
                        formValues[input.key].indexOf(field) === formValues[input.key].length - 1
                      ) {
                        // check if last element is empty when array is not required
                        return true;
                      }
                      return false;
                    },
                    {
                      messagePath: () => "contract.abiInteraction.validation.required",
                    }
                  ),
                  valid: withI18nMessage(
                    (value: string) => {
                      if (!value) {
                        return true;
                      }
                      return validateAbiValue(value, getRawFunctionType(input.type));
                    },
                    {
                      messagePath: () => "contract.abiInteraction.validation.invalid",
                    }
                  ),
                },
              }),
            },
          ];
        }
        return [
          input.key,
          {
            required: withI18nMessage(required, {
              messagePath: () => "contract.abiInteraction.validation.required",
            }),
            valid: withI18nMessage(
              (value: string) => {
                if (input.type === "ether") {
                  try {
                    parseEther(value as string); // will throw an error in case if the value is invalid
                    return true;
                  } catch {
                    return false;
                  }
                }
                return validateAbiValue(value, input.type);
              },
              {
                messagePath: () => "contract.abiInteraction.validation.invalid",
              }
            ),
          },
        ];
      })
    )
  ),
  // vuelidate doesn't support validating primitives array, so we need to wrap them in object
  computed(() =>
    Object.fromEntries(
      Object.entries(form.value).map(([key, val]) => [key, Array.isArray(val) ? val.map((v) => ({ value: v })) : val])
    )
  )
);

const errors = computed(() => {
  return Object.fromEntries(
    inputs.value.map((input) => {
      if (input.isArray) {
        if (v$.value[input.key].$dirty) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const errors = ((v$.value[input.key] as any).$each.$response.$errors ?? []).map((e: any) =>
            e.value[0]?.$message.toString()
          );
          return [input.key, errors];
        }
        return [input.key, []];
      }
      return [input.key, v$.value[input.key].$errors?.[0]?.$message.toString()];
    })
  );
});

const convertBoolean = (value: string | boolean) =>
  typeof value === "string" ? !["0", "false"].includes(value) : value;

const submit = async () => {
  const validationResult = await v$.value.$validate();
  if (!validationResult) {
    return;
  }
  // remove optional empty values from array
  const data: { [key: string]: string | string[] | boolean | boolean[] } = Object.fromEntries(
    Object.entries(form.value).map(([key, val]) => [key, Array.isArray(val) ? val.filter((v) => !!v) : val])
  );
  // convert booleans from string to bool
  inputs.value
    .filter((input) => input.type === "bool")
    .forEach((boolInput) => {
      const field = data[boolInput.key];
      if (field) {
        data[boolInput.key] = Array.isArray(field) ? field.map(convertBoolean) : convertBoolean(field);
      }
    });
  emit("submit", data);
};
</script>

<style scoped lang="scss">
.function-form {
  @apply space-y-3;

  .function-parameter {
    @apply space-y-2 text-base;
  }
}
</style>
