import { ClipboardCheckIcon } from "@heroicons/vue/outline";

import Badge from "./Badge.vue";

export default {
  title: "Common/Badge",
  component: Badge,
};

type Args = {
  type?: "label" | "pill";
  size?: "sm" | "md";
  color?: string;
  defaultSlot?: string;
  icon?: unknown;
}[];

const colors = ["primary", "secondary", "warning", "error", "danger", "success", "neutral"];

const Template = (variants: Args) => ({
  components: { Badge },
  setup() {
    return { variants };
  },
  template: `
    <Badge v-for="(item, index) in variants" :key="index" :type="item.type" :color="item.color" :size="item.size" :tooltip="item.tooltip">
      <template #icon v-if="item.icon">
        <component :is="item.icon" size="xs" />
      </template>
      <template #default v-if="item.defaultSlot">
        <span v-html="item.defaultSlot"></span>
      </template> 
    </Badge>
  `,
});

export const Small = Template.bind({}) as unknown as { args: Args };
Small.args = colors.map((e) => ({
  type: "label",
  size: "sm",
  color: e,
  defaultSlot: e,
}));

export const SmallWithIcon = Template.bind({}) as unknown as { args: Args };
SmallWithIcon.args = colors.map((e) => ({
  type: "label",
  size: "sm",
  color: e,
  defaultSlot: e,
  icon: ClipboardCheckIcon,
}));

export const Medium = Template.bind({}) as unknown as { args: Args };
Medium.args = colors.map((e) => ({
  type: "label",
  size: "md",
  color: e,
  defaultSlot: e,
}));

export const MediumWithIcon = Template.bind({}) as unknown as { args: Args };
MediumWithIcon.args = colors.map((e) => ({
  type: "label",
  size: "md",
  color: e,
  defaultSlot: e,
  icon: ClipboardCheckIcon,
}));

export const Pill = Template.bind({}) as unknown as { args: Args };
Pill.args = colors.map((e) => ({
  type: "pill",
  size: "md",
  color: e,
  defaultSlot: e,
}));

export const PillWithIcon = Template.bind({}) as unknown as { args: Args };
PillWithIcon.args = colors.map((e) => ({
  type: "pill",
  size: "md",
  color: e,
  defaultSlot: e,
  icon: ClipboardCheckIcon,
}));
