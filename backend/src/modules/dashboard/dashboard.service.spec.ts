import { DashboardService } from './dashboard.service';

type QueryBuilder = Record<string, jest.Mock>;

describe('DashboardService', () => {
  const createBuilder = (result: any): QueryBuilder => {
    const calls: string[] = [];
    const builder: QueryBuilder = {
      select: jest.fn(),
      from: jest.fn(),
      where: jest.fn(),
      innerJoin: jest.fn(),
      leftJoin: jest.fn(),
      groupBy: jest.fn(),
      orderBy: jest.fn(),
      limit: jest.fn(),
      then: jest.fn(),
      calls: calls as any,
    };

    const chain = (name: string) =>
      jest.fn().mockImplementation(() => {
        calls.push(name);
        return builder;
      });

    builder.from = chain('from');
    builder.where = chain('where');
    builder.innerJoin = chain('innerJoin');
    builder.leftJoin = chain('leftJoin');
    builder.groupBy = chain('groupBy');
    builder.orderBy = chain('orderBy');
    builder.limit = chain('limit');
    builder.then = jest.fn((resolve) => Promise.resolve(result).then(resolve));

    return builder;
  };

  it('applies tenant filters before grouping, ordering, and limiting', async () => {
    const builders = [
      createBuilder([{ value: 3 }]),
      createBuilder([{ value: 2 }]),
      createBuilder([{ total: 1024 }]),
      createBuilder([{ name: 'Policies', count: 1 }]),
      createBuilder([{ id: 'doc1', title: 'Doc', updatedAt: new Date() }]),
    ];
    const db = {
      select: jest.fn().mockImplementation(() => builders.shift()),
    };

    const service = new DashboardService(db as any);

    await service.getStats('tenant-a');

    const categoryCalls = (db.select.mock.results[3].value as QueryBuilder)
      .calls as unknown as string[];
    const recentCalls = (db.select.mock.results[4].value as QueryBuilder)
      .calls as unknown as string[];

    expect(categoryCalls.indexOf('where')).toBeLessThan(
      categoryCalls.indexOf('groupBy'),
    );
    expect(categoryCalls.indexOf('where')).toBeLessThan(
      categoryCalls.indexOf('limit'),
    );
    expect(recentCalls.indexOf('where')).toBeLessThan(
      recentCalls.indexOf('orderBy'),
    );
    expect(recentCalls.indexOf('where')).toBeLessThan(
      recentCalls.indexOf('limit'),
    );
  });

  it('does not add tenant filters when no tenant id is provided', async () => {
    const builders = [
      createBuilder([{ value: 3 }]),
      createBuilder([{ value: 2 }]),
      createBuilder([{ total: 1024 }]),
      createBuilder([]),
      createBuilder([]),
    ];
    const db = {
      select: jest.fn().mockImplementation(() => builders.shift()),
    };

    const service = new DashboardService(db as any);

    await service.getStats();

    for (const result of db.select.mock.results) {
      expect((result.value as QueryBuilder).where).not.toHaveBeenCalled();
    }
  });
});
