/* @jsx jsx */

import { jsx } from '@keystone-ui/core';
import { FieldContainer, FieldLabel } from '@keystone-ui/fields';
import { Node } from 'slate';
import { CellLink, CellContainer } from '@keystone-next/admin-ui/components';

import {
  CardValueComponent,
  CellComponent,
  FieldController,
  FieldControllerConfig,
  FieldProps,
} from '@keystone-next/types';
import { DocumentEditor } from './DocumentEditor';
import { ComponentBlock } from './component-blocks';
import { Relationships } from './DocumentEditor/relationship';

export const Field = ({ field, value, onChange, autoFocus }: FieldProps<typeof controller>) => (
  <FieldContainer>
    <FieldLabel>{field.label}</FieldLabel>
    <DocumentEditor
      autoFocus={autoFocus}
      value={value}
      onChange={onChange}
      componentBlocks={field.componentBlocks}
      relationships={field.relationships}
    />
  </FieldContainer>
);

export const Cell: CellComponent = ({ item, field, linkTo }) => {
  let value = item[field.path] + '';
  return linkTo ? (
    <CellLink {...linkTo}>{JSON.stringify(value)}</CellLink>
  ) : (
    <CellContainer>{JSON.stringify(value)}</CellContainer>
  );
};
Cell.supportsLinkTo = true;

export const CardValue: CardValueComponent = ({ item, field }) => {
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      <pre>{JSON.stringify(item[field.path], null, 2)}</pre>
    </FieldContainer>
  );
};

export const allowedExportsOnCustomViews = ['componentBlocks'];

export const controller = (
  config: FieldControllerConfig<{ relationships: Relationships }>
): FieldController<Node[]> & {
  componentBlocks: Record<string, ComponentBlock>;
  relationships: Relationships;
} => {
  return {
    path: config.path,
    label: config.label,
    graphqlSelection: `${config.path} {document}`,
    componentBlocks: config.customViews.componentBlocks || {},
    relationships: config.fieldMeta.relationships,
    defaultValue: [{ type: 'paragraph', children: [{ text: '' }] }],
    deserialize: data => {
      return data[config.path]?.document || [{ type: 'paragraph', children: [{ text: '' }] }];
    },
    serialize: value => ({
      [config.path]: value,
    }),
  };
};
