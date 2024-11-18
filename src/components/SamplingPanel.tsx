import React, { useState, useEffect } from "react";

import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { FieldGroup, Label } from "../ui/field";
import { Input } from "../ui/input";
import {
  NumberField,
  NumberFieldInput,
  NumberFieldSteppers,
} from "../ui/numberfield";
import { TextField } from "react-aria-components";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopover,
  SelectItem,
  SelectContent,
} from "../ui/select";
import { Separator } from "../ui/separator";
import Settings from "@spectrum-icons/workflow/Settings";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

import {
  storageManager,
  SamplingSettings,
  getDefaultSamplingSettings,
  SamplingPanelTogglesEnum,
} from "../storage";
import { Key } from "react-aria-components";
import Markdown from "react-markdown";

const SamplingPanel = () => {
  const [samplingUpdateCounter, setSamplingUpdateCounter] = useState(0);
  const [samplingSettings, setSamplingSettings] = useState<SamplingSettings>(
    storageManager.getSamplingSettings(
      storageManager.getCurrentFormatSettingsId()
    )
  );

  const [panelToggles, setPanelToggles] = useState<SamplingPanelTogglesEnum[]>(
    []
  );
  useEffect(() => {
    storageManager.loadedSamplersEnabledForShortcutPanelCallback = () => {
      setPanelToggles(storageManager.getSamplersEnabledForShortcutPanel());
      setSamplingSettings(
        storageManager.getSamplingSettings(
          storageManager.getCurrentSamplingSettingsId()
        )
      );
    };
    return () => {
      storageManager.loadedSamplersEnabledForShortcutPanelCallback = null;
    };
  }, []);
  const setPanelTogglesAndPersist = (toggles: SamplingPanelTogglesEnum[]) => {
    setPanelToggles(toggles);
    storageManager.setSamplersEnabledForShortcutPanel(toggles);
  };

  return (
    <div className="panel m-1 px-2 py-2 rounded-md bg-primary text-primary-foreground">
      <div className="flex items-center">
        <span className="text-md font-medium">Sampling</span>
        <div className="ml-auto">
          <span className="corner-button">
            <EditSamplingDialog
              samplingPanelToggles={panelToggles}
              setSamplingPanelToggles={setPanelTogglesAndPersist}
              samplingSettings={samplingSettings}
              setSamplingSettings={setSamplingSettings}
              samplingUpdateCounter={samplingUpdateCounter}
              setSamplingUpdateCounter={setSamplingUpdateCounter}
            />
          </span>
        </div>
      </div>
      {panelToggles.includes(SamplingPanelTogglesEnum.MaxTokens) ? (
        <>
          <SamplingFieldSelector
            field="max_tokens"
            min={64}
            max={32768}
            step={64}
            value={samplingSettings.max_tokens}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
          />
        </>
      ) : (
        <></>
      )}
      {panelToggles.includes(SamplingPanelTogglesEnum.MaxContextLength) ? (
        <>
          <SamplingFieldSelector
            field="max_context_length"
            min={128}
            max={32768}
            step={128}
            value={samplingSettings.max_context_length}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
          />
        </>
      ) : (
        <></>
      )}
      {panelToggles.includes(SamplingPanelTogglesEnum.Seed) ? (
        <>
          <SamplingFieldSelector
            field="sampler_seed"
            min={-1}
            max={4294967295}
            step={1}
            value={samplingSettings.sampler_seed}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
          />
        </>
      ) : (
        <></>
      )}
      {panelToggles.includes(SamplingPanelTogglesEnum.Temperature) ? (
        <>
          <SamplingFieldSelector
            field="temperature"
            min={0.0}
            max={5.0}
            step={0.05}
            value={samplingSettings.temperature}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
          />
        </>
      ) : (
        <></>
      )}
      {panelToggles.includes(SamplingPanelTogglesEnum.MinP) ? (
        <>
          <SamplingFieldSelector
            field="min_p"
            min={0.0}
            max={1.0}
            step={0.01}
            value={samplingSettings.min_p}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
          />
        </>
      ) : (
        <></>
      )}
      {panelToggles.includes(SamplingPanelTogglesEnum.TopP) ? (
        <>
          <SamplingFieldSelector
            field="top_p"
            min={0.0}
            max={1.0}
            step={0.01}
            value={samplingSettings.top_p}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
          />
        </>
      ) : (
        <></>
      )}
      {panelToggles.includes(SamplingPanelTogglesEnum.TopK) ? (
        <>
          <SamplingFieldSelector
            field="top_k"
            min={-1}
            max={20}
            step={1}
            value={samplingSettings.top_k}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
          />
        </>
      ) : (
        <></>
      )}
      {panelToggles.includes(SamplingPanelTogglesEnum.TypicalP) ? (
        <>
          <SamplingFieldSelector
            field="typical_p"
            min={0.0}
            max={1.0}
            step={0.05}
            value={samplingSettings.typical_p}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
          />
        </>
      ) : (
        <></>
      )}
      {panelToggles.includes(SamplingPanelTogglesEnum.QuadraticSmoothing) ? (
        <>
          <SamplingFieldSelector
            field="smoothing_factor"
            min={0.0}
            max={5.0}
            step={0.05}
            value={samplingSettings.smoothing_factor}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
          />
          <SamplingFieldSelector
            field="smoothing_curve"
            min={1.0}
            max={10.0}
            step={0.1}
            value={samplingSettings.smoothing_curve}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
          />
        </>
      ) : (
        <></>
      )}
      {panelToggles.includes(SamplingPanelTogglesEnum.RepetitionPenalty) ? (
        <>
          <SamplingFieldSelector
            field="repetition_penalty"
            min={1.0}
            max={3}
            step={0.05}
            value={samplingSettings.repetition_penalty}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
          />
          <SamplingFieldSelector
            field="repetition_penalty_range"
            min={0}
            max={2048}
            step={128}
            value={samplingSettings.repetition_penalty_range}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
          />
        </>
      ) : (
        <></>
      )}
    </div>
  );
};

interface EditSamplingDialogProps {
  samplingUpdateCounter: number;
  setSamplingUpdateCounter: React.Dispatch<React.SetStateAction<number>>;
  samplingPanelToggles: SamplingPanelTogglesEnum[];
  setSamplingPanelToggles: (s: SamplingPanelTogglesEnum[]) => void;
  samplingSettings: SamplingSettings;
  setSamplingSettings: React.Dispatch<React.SetStateAction<SamplingSettings>>;
}

const EditSamplingDialog = (props: EditSamplingDialogProps) => {
  const [samplingSettingsId, setSamplingSettingsId] = useState(
    storageManager.getCurrentSamplingSettingsId()
  );
  const handleSamplingSettingsIdChange = (key: Key) => {
    const samplingSettingsById = storageManager.getAllSamplingSettings();
    if (typeof key === "string" && samplingSettingsById.has(key)) {
      storageManager.setCurrentSamplingSettingsId(key);
      setSamplingSettingsId(key);
      const newSamplingSettings = samplingSettingsById.get(key);
      if (newSamplingSettings) {
        props.setSamplingSettings(newSamplingSettings);
      }
      props.setSamplingUpdateCounter((s) => s + 1);
    }
  };

  const defaultSamplingSettings = getDefaultSamplingSettings();
  const handleReset = () => {
    const resetSamplingSettings = {
      ...defaultSamplingSettings,
      name: samplingSettingsId,
    };
    storageManager.setSamplingSettings(resetSamplingSettings);
    props.setSamplingSettings(resetSamplingSettings);
    props.setSamplingUpdateCounter((s) => s + 1);
  };

  const handleDelete = () => {
    storageManager.deleteSamplingSettings(samplingSettingsId);
    // switch to the default sampling settings
    storageManager.setCurrentSamplingSettingsId(defaultSamplingSettings.name);
    setSamplingSettingsId(defaultSamplingSettings.name);
    props.setSamplingSettings(defaultSamplingSettings);
    props.setSamplingUpdateCounter((s) => s + 1);
  };

  const currentFormatIsDefault =
    samplingSettingsId === defaultSamplingSettings.name;

  return (
    <DialogTrigger>
      <Button size="icon" aria-label="Edit Lorebook">
        <Settings />
      </Button>
      <DialogOverlay>
        <DialogContent
          className="max-w-[90%] max-h-[90%] overflow-y-scroll"
          isDismissable={true}
        >
          <DialogHeader className="mt-2">
            <DialogTitle>Sampling Settings</DialogTitle>
          </DialogHeader>
          <Separator />

          <div
            className="flex gap-1.5 mr-2"
            key={`SamplingSelector_${props.samplingUpdateCounter}_${samplingSettingsId}`}
          >
            <TextField className="flex items-center gap-1.5 mr-2">
              <Label className="text-md">Selected: </Label>
              <Select
                placeholder="Select an item"
                aria-label="item selection"
                onSelectionChange={handleSamplingSettingsIdChange}
                defaultSelectedKey={samplingSettingsId}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopover>
                  <SelectContent aria-label="items" className="px-2 py-2">
                    {[...storageManager.getAllSamplingSettings().values()].map(
                      (fs: SamplingSettings) => {
                        return (
                          <SelectItem
                            textValue={fs.name}
                            id={fs.name}
                            key={fs.name}
                          >
                            {fs.name}
                          </SelectItem>
                        );
                      }
                    )}
                  </SelectContent>
                </SelectPopover>
              </Select>
            </TextField>

            <CopySamplingButton
              setSamplingSettingsId={setSamplingSettingsId}
              setSamplingSettings={props.setSamplingSettings}
            />
            <Button
              size="md"
              aria-label="Reset to Defaults"
              onPress={handleReset}
            >
              Reset
            </Button>
            {!currentFormatIsDefault ? (
              <Button
                size="md"
                aria-label="Delete Preset"
                onPress={handleDelete}
              >
                Delete
              </Button>
            ) : (
              <></>
            )}
          </div>

          <SamplingSettingsEditor
            samplingSettings={props.samplingSettings}
            setSamplingSettings={props.setSamplingSettings}
            key={`SamplingEditor_${props.samplingUpdateCounter}`}
          />

          <DialogHeader className="mt-2">
            <DialogTitle>Panel Shortcuts</DialogTitle>
          </DialogHeader>
          <Separator />
          <Markdown>
            {`Toggles here enable showing the related setting(s) on the sidebar panel.  
\`Token Length\` refers to both max_tokens and max_context_length.  
\`Quadratic Smoothing\` refers to both smoothing_factor and smoothing_curve.  
\`Repetition Penalty\` refers to both repetition_penalty and repetition_penalty_range.  
            `}
          </Markdown>

          {Object.values(SamplingPanelTogglesEnum).map(
            (s: SamplingPanelTogglesEnum) => {
              return (
                <Checkbox
                  defaultSelected={props.samplingPanelToggles.includes(s)}
                  onChange={(isSelected: boolean) => {
                    if (isSelected) {
                      props.setSamplingPanelToggles([
                        ...props.samplingPanelToggles,
                        s,
                      ]);
                    } else {
                      props.setSamplingPanelToggles(
                        props.samplingPanelToggles.filter((t) => t !== s)
                      );
                    }
                  }}
                  key={s}
                >
                  {s}
                </Checkbox>
              );
            }
          )}
        </DialogContent>
      </DialogOverlay>
    </DialogTrigger>
  );
};

interface SamplingSettingsEditorProps {
  samplingSettings: SamplingSettings;
  setSamplingSettings: React.Dispatch<React.SetStateAction<SamplingSettings>>;
}

const SamplingSettingsEditor = ({
  samplingSettings,
  setSamplingSettings,
}: SamplingSettingsEditorProps) => {
  const boolToString = new Map<boolean, string>();
  boolToString.set(true, "true");
  boolToString.set(false, "false");
  const handleBooleanSelectorChange = (
    key: Key,
    field: keyof SamplingSettings
  ) => {
    if (typeof key !== "string") {
      throw Error(
        `FormatSettingsEditor.handleChatRoleChange got unexpected integer key`
      );
    }
    var nextSamplingSetings: SamplingSettings = samplingSettings;
    if (field === "temperature_last") {
      nextSamplingSetings = {
        ...nextSamplingSetings,
        ...{ temperature_last: key === "true" },
      };
    } else if (field === "add_bos_token") {
      nextSamplingSetings = {
        ...nextSamplingSetings,
        ...{ add_bos_token: key === "true" },
      };
    } else if (field === "ban_eos_token") {
      nextSamplingSetings = {
        ...nextSamplingSetings,
        ...{ ban_eos_token: key === "true" },
      };
    } else if (field === "skip_special_tokens") {
      nextSamplingSetings = {
        ...nextSamplingSetings,
        ...{ skip_special_tokens: key === "true" },
      };
    } else {
      throw Error(
        `SamplingSettingsEditor.handleBooleanSelectorChange called for ${field}`
      );
    }
    setSamplingSettings(nextSamplingSetings);
    storageManager.setSamplingSettings(nextSamplingSetings);
  };
  const onBooleanSelectorFocused = (s: keyof SamplingSettings) => {
    if (s === "temperature_last") {
      setDescription(
        `\`temperature_last\` makes \`temperature\` the last sampler instead of the first. This allows samplers like \`min_p\` to cull unlikely tokens before skewing the remaining tokens with the \`temperature\` sampler.`
      );
    } else if (s === "add_bos_token") {
      setDescription(
        `\`add_bos_token\` adds a special token that marks the beginning of a document. Set this to \`false\` to treat the prompt as the middle of a document.`
      );
    } else if (s === "ban_eos_token") {
      setDescription(
        `\`ban_eos_token\` prevents the AI from ending it's response early. If the AI does not know how to continue, setting this to \`true\` may lead to less coherent text.`
      );
    } else if (s === "skip_special_tokens") {
      setDescription(
        `\`skip_special_tokens\` prevents metadata from being treated as text. This is expected to be \`true\`.`
      );
    } else {
      setDescription("Select a field to see a description.");
    }
  };
  const booleanSelector = (field: keyof SamplingSettings) => {
    return (
      <TextField className="flex items-center gap-1.5 mr-2 my-1">
        <Label className="text-md">{field}: </Label>
        <div className="ml-auto">
          <Select
            placeholder="Select an item"
            aria-label="item selection"
            onSelectionChange={(key: Key) => {
              handleBooleanSelectorChange(key, field);
            }}
            defaultSelectedKey={boolToString.get(
              samplingSettings[field] === true
            )}
            className="flex w-[180px]"
            onFocus={() => {
              onBooleanSelectorFocused(field);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectPopover>
              <SelectContent aria-label="items" className="px-2 py-2">
                <SelectItem textValue={"true"} id={"true"}>
                  True
                </SelectItem>
                <SelectItem textValue={"false"} id={"false"}>
                  False
                </SelectItem>
              </SelectContent>
            </SelectPopover>
          </Select>
        </div>
      </TextField>
    );
  };

  const [description, setDescription] = useState(
    "Select a field to see a description."
  );
  const onFieldFocused = (s: keyof SamplingSettings) => {
    if (s === "max_tokens") {
      setDescription(
        "`max_tokens` is the maximum length of the AI response. A token is a piece of text, often a word or part of a word, treated as a single unit by an LLM."
      );
    } else if (s === "max_context_length") {
      setDescription(
        "`max_context_length` is the maximum length of the text that the AI processes (e.g. the part provided to it and the response)."
      );
    } else if (s === "sampler_seed") {
      setDescription(
        "`sampler_seed` sets the input to the random number generator that the AI uses. This can be used to make the output more deterministic. In most cases this should be -1, so that the output is varies across retries."
      );
    } else if (s === "temperature") {
      setDescription(
        "`temperature` acts as a randomness parameter in LLMs, determining the likelihood of selecting less probable words.."
      );
    } else if (s === "min_p") {
      setDescription(`\`min_p\` helps maintain the coherence of generated text by preventing the selection of highly unlikely and often out-of-place tokens.  
            To disable it, set \`min_p=0\`.  
            Recommended values are \`min_p=.05\`.  
            **[Click for detailed write-up.](https://gist.github.com/kalomaze/4473f3f975ff5e5fade06e632498f73e#min-p)**  `);
    } else if (s === "top_p") {
      setDescription(
        "`top_p` controls the range of tokens considered by selecting those whose cumulative probability sums to less than the specified value. So, it's something like 'top %' of tokens."
      );
    } else if (s === "top_k") {
      setDescription(
        "`top_k` controls the range of tokens considered by selecting from the top k mostly likely tokens."
      );
    } else if (s === "typical_p") {
      setDescription(`\`typical_p\` acts as a filter, ensuring the model prefers tokens that are significantly more probable than random, thus promoting more coherent and predictable text generation.  
            **[Click for a reddit thread on it](https://www.reddit.com/r/LocalLLaMA/comments/153bnly/what_does_typical_p_actually_do/)**`);
    } else if (s === "smoothing_factor" || s === "smoothing_curve") {
      setDescription(`\`smoothing_factor\` and \`smoothing_curve\` make the topmost tokens more evenly probable while reducing the probability of extremely unlikely tokens.  
            To disable it, set \`smoothing_factor=0\` and \`smoothing_curve=1\`.  
            Recommended values are \`smoothing_factor=.2\` and \`smoothing_curve=1 to 3\`.  
            **[Click for detailed write-up.](https://gist.github.com/kalomaze/4473f3f975ff5e5fade06e632498f73e#smooth-sampling--quadratic-sampling)**  `);
    } else if (s === "repetition_penalty" || s === "repetition_penalty_range") {
      setDescription(`\`repetition_penalty\` and \`repetition_penalty_range\` penalizes tokens that have already been seen in the most recent #repetition_penalty_range tokens. This is used as a kludge to reduce repetition, but may have unintended effects.  
            **[Click for detailed write-up.](https://gist.github.com/kalomaze/4473f3f975ff5e5fade06e632498f73e#repetition-penalty)**  `);
    } else {
      setDescription("Select a field to see a description.");
    }
  };

  return (
    <>
      <PanelGroup direction="horizontal" key={samplingSettings.name}>
        <Panel defaultSize={40}>
          <SamplingFieldSelector
            field="max_tokens"
            min={64}
            max={32768}
            step={64}
            value={samplingSettings.max_tokens}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
            onFieldFocused={onFieldFocused}
          />
          <SamplingFieldSelector
            field="max_context_length"
            min={128}
            max={32768}
            step={128}
            value={samplingSettings.max_context_length}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
            onFieldFocused={onFieldFocused}
          />
          <SamplingFieldSelector
            field="sampler_seed"
            min={-1}
            max={4294967295}
            step={1}
            value={samplingSettings.sampler_seed}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
            onFieldFocused={onFieldFocused}
          />
          <SamplingFieldSelector
            field="temperature"
            min={0.0}
            max={5.0}
            step={0.05}
            value={samplingSettings.temperature}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
            onFieldFocused={onFieldFocused}
          />
          <SamplingFieldSelector
            field="min_p"
            min={0.0}
            max={1.0}
            step={0.01}
            value={samplingSettings.min_p}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
            onFieldFocused={onFieldFocused}
          />
          <SamplingFieldSelector
            field="top_p"
            min={0.0}
            max={1.0}
            step={0.01}
            value={samplingSettings.top_p}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
            onFieldFocused={onFieldFocused}
          />
          <SamplingFieldSelector
            field="top_k"
            min={-1}
            max={20}
            step={1}
            value={samplingSettings.top_k}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
            onFieldFocused={onFieldFocused}
          />
          <SamplingFieldSelector
            field="typical_p"
            min={0.0}
            max={1.0}
            step={0.05}
            value={samplingSettings.typical_p}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
            onFieldFocused={onFieldFocused}
          />
          <SamplingFieldSelector
            field="smoothing_factor"
            min={0.0}
            max={5.0}
            step={0.05}
            value={samplingSettings.smoothing_factor}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
            onFieldFocused={onFieldFocused}
          />
          <SamplingFieldSelector
            field="smoothing_curve"
            min={1.0}
            max={10.0}
            step={0.1}
            value={samplingSettings.smoothing_curve}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
            onFieldFocused={onFieldFocused}
          />
          <SamplingFieldSelector
            field="repetition_penalty"
            min={1.0}
            max={3}
            step={0.05}
            value={samplingSettings.repetition_penalty}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
            onFieldFocused={onFieldFocused}
          />
          <SamplingFieldSelector
            field="repetition_penalty_range"
            min={0}
            max={2048}
            step={128}
            value={samplingSettings.repetition_penalty_range}
            samplingSettings={samplingSettings}
            setSamplingSettings={setSamplingSettings}
            onFieldFocused={onFieldFocused}
          />
        </Panel>
        <PanelResizeHandle />
        <Panel>
          {booleanSelector("temperature_last")}
          {booleanSelector("add_bos_token")}
          {booleanSelector("ban_eos_token")}
          {booleanSelector("skip_special_tokens")}
          <div className="border p-1 mr-2">
            <span>
              <Label className="text-md">Description: </Label>
              <Markdown>{description}</Markdown>
            </span>
          </div>
        </Panel>
      </PanelGroup>
    </>
  );
};

interface SamplingFieldSelectorProps {
  field: keyof SamplingSettings;
  min: number;
  max: number;
  value: number;
  step: number;
  samplingSettings: SamplingSettings;
  setSamplingSettings: React.Dispatch<React.SetStateAction<SamplingSettings>>;
  onFieldFocused?: (s: keyof SamplingSettings) => void;
}

const SamplingFieldSelector = ({
  field,
  min,
  max,
  value,
  step,
  samplingSettings,
  setSamplingSettings,
  onFieldFocused,
}: SamplingFieldSelectorProps) => {
  const handleNumericSelectorUpdate = (
    value: number,
    field: keyof SamplingSettings
  ) => {
    var nextSamplingSettings: SamplingSettings = { ...samplingSettings };
    if (field === "max_tokens") {
      nextSamplingSettings[field] = value;
    } else if (field === "max_context_length") {
      nextSamplingSettings[field] = value;
    } else if (field === "sampler_seed") {
      nextSamplingSettings[field] = value;
    } else if (field === "temperature") {
      nextSamplingSettings[field] = value;
    } else if (field === "min_p") {
      nextSamplingSettings[field] = value;
    } else if (field === "top_p") {
      nextSamplingSettings[field] = value;
    } else if (field === "top_k") {
      nextSamplingSettings[field] = value;
    } else if (field === "typical_p") {
      nextSamplingSettings[field] = value;
    } else if (field === "smoothing_factor") {
      nextSamplingSettings[field] = value;
    } else if (field === "smoothing_curve") {
      nextSamplingSettings[field] = value;
    } else if (field === "repetition_penalty") {
      nextSamplingSettings[field] = value;
    } else if (field === "repetition_penalty_range") {
      nextSamplingSettings[field] = value;
    } else {
      throw Error(
        `SamplingSettingsEditor.handleNumericSelectorUpdate called for ${field}`
      );
    }
    setSamplingSettings(nextSamplingSettings);
    storageManager.setSamplingSettings(nextSamplingSettings);
  };
  var setFocusedField = (e: React.FocusEvent<Element, Element>) => {
    if (onFieldFocused) {
      onFieldFocused(field);
    }
  };
  return (
    <NumberField
      minValue={min}
      maxValue={max}
      defaultValue={value}
      step={step}
      onChange={(v: number) => {
        handleNumericSelectorUpdate(v, field);
      }}
      onFocus={setFocusedField}
      className="flex items-center gap-1.5 mr-2 my-1"
    >
      <Label className="text-sm">{field}</Label>
      <div className="ml-auto">
        <FieldGroup className="w-[90px]">
          <NumberFieldInput style={{ color: "#0f172a" }} />
          <NumberFieldSteppers />
        </FieldGroup>
      </div>
    </NumberField>
  );
};

interface CopySamplingButtonPrompts {
  setSamplingSettingsId: React.Dispatch<React.SetStateAction<string>>;
  setSamplingSettings: React.Dispatch<React.SetStateAction<SamplingSettings>>;
}

const CopySamplingButton = ({
  setSamplingSettingsId,
  setSamplingSettings,
}: CopySamplingButtonPrompts) => {
  const [samplingName, setSamplingName] = useState("SamplingSettingsName");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSamplingName(event.target.value);
  };

  const handleCopy = (close: () => void) => {
    const newSamplingSettings = {
      ...storageManager.getSamplingSettings(
        storageManager.getCurrentSamplingSettingsId()
      ),
      name: samplingName,
    };
    storageManager.setSamplingSettings(newSamplingSettings);
    setSamplingSettings(newSamplingSettings);
    storageManager.setCurrentSamplingSettingsId(samplingName);
    setSamplingSettingsId(samplingName);
    close();
  };
  return (
    <DialogTrigger>
      <Button size="md" aria-label="Copy to a New Format Settings">
        Copy
      </Button>
      <DialogOverlay>
        <DialogContent className="max-w-[40%] max-h-[90%]" isDismissable={true}>
          {({ close }) => (
            <>
              <DialogHeader>
                <DialogTitle>Copy to a New Sampling Settings</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-5 items-center gap-4">
                <Label htmlFor="formatName" className="text-right">
                  Name:
                </Label>
                <Input
                  id="formatName"
                  defaultValue={samplingName}
                  className="col-span-4"
                  onChange={handleInputChange}
                />
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  onPress={() => {
                    handleCopy(close);
                  }}
                >
                  Copy
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </DialogOverlay>
    </DialogTrigger>
  );
};

export default SamplingPanel;
