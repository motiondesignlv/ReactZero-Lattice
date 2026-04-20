import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Grid } from './Grid';
import { Cell } from './Cell';
import { Row } from './Row';

const meta: Meta<typeof Grid> = {
  title: 'Core/Grid',
  component: Grid,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Grid>;

const data = [
  { id: 1, name: 'Lattice Core', version: '0.1.0' },
  { id: 2, name: 'Lattice React', version: '0.1.0' },
];

export const Basic: Story = {
  args: {
    data,
    rowKey: 'id',
    children: (
      <>
        <Grid.Header>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px' }}>
            <Cell columnKey="id" render={() => <b>ID</b>} />
            <Cell columnKey="name" render={() => <b>Name</b>} />
            <Cell columnKey="version" render={() => <b>Version</b>} />
          </div>
        </Grid.Header>
        <Grid.Body>
          <Row>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px' }}>
              <Cell columnKey="id" />
              <Cell columnKey="name" />
              <Cell columnKey="version" />
            </div>
          </Row>
        </Grid.Body>
      </>
    ),
  },
};
