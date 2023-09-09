import ExpandableText from "./ExpandableText.vue";

export default {
  title: "Common/ExpandableText",
  component: ExpandableText,
};

type Args = {
  text: string;
  maxHeight?: number;
};

const DefaultTemplate = (args: Args) => ({
  components: { ExpandableText },
  setup() {
    return { ...args };
  },
  template: `
    <ExpandableText>
      <template #default>
        <pre>{{ text }}</pre>
      </template>
      <template #button="{ expanded }">
        {{ expanded ? 'Show less' : 'Show more' }}
      </template>
    </ExpandableText>
  `,
});

const SpecifiedHeightTemplate = (args: Args) => ({
  components: { ExpandableText },
  setup() {
    return { ...args };
  },
  template: `
    <ExpandableText :max-height="maxHeight">
      <template #default>
        {{ text }}
      </template>
      <template #button="{ expanded }">
        {{ expanded ? 'Show less' : 'Show more' }}
      </template>
    </ExpandableText>
  `,
});

export const Default = DefaultTemplate.bind({}) as unknown as { args: Args };
Default.args = {
  text: "ParserError: Expected identifier but got 'constructor'\n --> Source.sol:9:5:\n  |\n9 |     constructor(string memory _greeting) {\n  |     ^^^^^^^^^^^\n\n",
};

export const SpecifiedHeight = SpecifiedHeightTemplate.bind({}) as unknown as { args: Args };
SpecifiedHeight.args = {
  text: "ParserError: Expected identifier but got 'constructor'\n --> Source.sol:9:5:\n  |\n9 |     constructor(string memory _greeting) {\n  |     ^^^^^^^^^^^\n\n",
  maxHeight: 50,
};
