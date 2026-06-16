import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { describe, it, expect } from 'vitest';

describe('Card component', () => {
  it('renders correctly with title and content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
        <CardContent>Test Content</CardContent>
      </Card>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
