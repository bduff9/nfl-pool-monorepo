import { addOrdinal } from "@nfl-pool-monorepo/utils/numbers";
import { Column, Row, Text } from "react-email";

type Props = {
  lines: string[];
  points: number;
  rank: number;
  week: number;
};

const WeekRecapSection = ({ lines, points, rank, week }: Props) => (
  <Row>
    <Column className="bg-white pt-8 px-6 pb-4">
      <Text className="text-xl">Week {week} Recap</Text>
      <Row>
        <Column className="w-1/2 bg-gray-100 border-4 border-solid border-white rounded-md py-3 text-center">
          <Text className="m-0 text-3xl font-bold">{addOrdinal(rank)}</Text>
          <Text className="m-0 text-xs uppercase text-gray-600">Weekly rank</Text>
        </Column>
        <Column className="w-1/2 bg-gray-100 border-4 border-solid border-white rounded-md py-3 text-center">
          <Text className="m-0 text-3xl font-bold">{points}</Text>
          <Text className="m-0 text-xs uppercase text-gray-600">Points earned</Text>
        </Column>
      </Row>
      <ul>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </Column>
  </Row>
);

export default WeekRecapSection;
